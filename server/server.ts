const express = require('express');
const graphql = require('graphql');
const { ApolloServer } = require('apollo-server-express');
const { gql } = require('apollo-server');
// import { rateLimiter } from './rateLimiter'
import { portaraSchemaDirective } from './rateLimiter';
// Types
const typeDefs = gql`
  directive @portara(limit: Int!, per: String!) on FIELD_DEFINITION | OBJECT 

  type Query {
    test: String!
  }
  type Mutation  @portara(limit: 8, per: "1 secs"){
    hello: String! @portara(limit: 2, per: "100")
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
// Express & Apollo setup
const app = express();
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req, res }) => ({ req, res }),
  // plugins: [
  //   {
  //     requestDidStart(requestContext, responseContext) {
  //       rateLimiter(requestContext, responseContext)
  //     },
  //   }
  // ],
  schemaDirectives: {
    portara: portaraSchemaDirective,
  },
});
server.applyMiddleware({
  app,
});
app.listen({ port: 4000 }, () => {
  console.log(`Server running @ PORT 4000`);
});
