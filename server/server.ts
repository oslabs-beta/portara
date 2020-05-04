const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { gql } = require('apollo-server');

// Types
const typeDefs = gql`
  type Query {
    hello: String!
  }, 
`;
 
// Resolvers
const resolvers = {
  Query: {
    hello: async () => {
      return 'hello'
    }
  },
};

const app = express();

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.applyMiddleware({
  app,
});

app.listen({port: 4000}, () => {
  console.log(`Server running @ PORT 4000`)
})
