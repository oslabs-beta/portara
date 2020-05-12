const { ApolloServer, gql } = require('apollo-server');
import { portaraSchemaDirective } from './rateLimiter';
import { makeExecutableSchema } from 'graphql-tools'

// typeDefs
const typeDefs = gql`
  directive @portara(limit: Int!, per: ID!) on FIELD_DEFINITION | OBJECT 

  type Query {
    test: String!
  }
  type Mutation  @portara(limit: 8, per: 10){
    hello: String! @portara(limit: 2, per: "10")
    bye: String! #@portara(limit: 2)
  }
`;

// Resolvers
const resolvers = {
  Query: {
    test: (parent, args, context, info) => {
      return 'Test'
    }
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
