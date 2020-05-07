const express = require('express');
const graphql = require('graphql')
const { ApolloServer } = require('apollo-server-express');
const { gql } = require('apollo-server');
// import { rateLimiter } from './rateLimiter'
import { portaraSchemaDirective } from './rateLimiter'

// Types
const typeDefs = gql`
  directive @portara(limit: Int!) on FIELD_DEFINITION | OBJECT

  type Query {
    test: String!
  }, 
  type Mutation @portara(limit: 2) {
    hello: String! 
  }, 
`;
 
// Resolvers
const resolvers = {
  Mutation: {
    hello: (parent, args, context, info) => {
      return 'Request completed and returned'
    }
  },
};


// Express & Apollo setup
const app = express();
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({req, res}) => ({req, res}),
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
})

server.applyMiddleware({
  app,
});

app.listen({port: 4000}, () => {
  console.log(`Server running @ PORT 4000`)
})
