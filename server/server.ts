const { ApolloServer, gql } = require('apollo-server');
import portaraSchemaDirective from './portara/portaraSchemaDirective';
import { GraphQLClient } from 'kikstart-graphql-client';

// typeDefs
const typeDefs = gql`
  directive @portara(limit: Int!, per: ID!, throttle: ID!) on FIELD_DEFINITION | OBJECT

  type Query {
    test: String!
  }
  type Mutation @portara(limit: 4, per: 10, throttle: "500ms") {
    hello: String! @portara(limit: 2, per: "10 seconds", throttle: "500 ms")
    bye: String!
  }
`;

// Resolvers
const resolvers = {
  Query: {
    test: (parent, args, context, info) => {
      return 'Test';
    },
  },
  Mutation: {
    hello: (parent, args, context, info) => {
      return 'Request completed and returned';
    },
    bye: (parent, args, context, info) => {
      return 'Goodbye world';
    },
  },
};

const Subclient = new GraphQLClient({
  url: 'http://portara-web.herokuapp.com/graphql',
  wsUrl: 'wss://portara-web.herokuapp.com/graphql',
});

Subclient.runSubscription(`subscription { testSub }`).subscribe({
  next: (res) => console.log('res', res),
  error: (error) => console.error('error',error),
  complete: () => console.log('done'),
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req, res }) => ({ req, res }),
  schemaDirectives: {
    portara: portaraSchemaDirective,
  },
});

server.listen({ port: 4000 }, () => {
  console.log(`Server running @ PORT 4000`);
});
