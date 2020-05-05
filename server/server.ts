const express = require('express');
const graphql = require('graphql')
const { ApolloServer } = require('apollo-server-express');
const { gql } = require('apollo-server');
import { rateLimiter } from './rateLimiter'

// Types
const typeDefs = gql`
  type Query {
    test: String!
  }, 
  type Mutation {
    hello: String!
  }, 
`;
 
// Resolvers
const resolvers = {
  Mutation: {
    hello: (parent, args, context, info) => {
      // console.log(context.req.body)
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
  plugins: [
    {
      requestDidStart(requestContext, responseContext) {
        rateLimiter(requestContext, responseContext)
      },   
    }
  ]
})

server.applyMiddleware({
  app,
});

app.listen({port: 4000}, () => {
  console.log(`Server running @ PORT 4000`)
})
