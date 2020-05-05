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
    hello: (parent, args, context, info) => {
      // console.log(context.req.body)
      return 'Request completed and returned'
    }
  },
};

const bool = false;

// Express & Apollo setup
const app = express();
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({req, res}) => ({req, res}),
  plugins: [
    {
      // serverWillStart() {console.log('server started')},
      requestDidStart(requestContext) {
        console.log('req started')
        return {
          parsingDidStart(requestContext) {
            console.log(requestContext.context.req.ip)
            if (bool) {
              console.log('parsin')
            } else {
              throw new Error('Too many connects')
            }
          },
        }
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
