const { ApolloServer, gql } = require('apollo-server');
import portaraSchemaDirective from './portara/portaraSchemaDirective';
import { GraphQLClient } from 'kikstart-graphql-client';

export let x:any = 2;


// typeDefs
const typeDefs = gql`
  directive @portara(limit: Int!, per: ID!, throttle: ID!) on FIELD_DEFINITION | OBJECT

  type Query {
    test: String!
  }
  type Mutation @portara(limit: 10, per: 10, throttle: "500ms") {
    hello: String! @portara(limit: 2, per: "20 seconds", throttle: "0")
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
      console.log(x)
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
  next: (res) => {
    console.log('res', res)
    x = res.data.testSub;
    if (x === 'sub returned') {
      x = 5
    }
    console.log(x)
  },
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
