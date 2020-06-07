const { ApolloServer, gql } = require('apollo-server');
// For Server to Server GraphQL communication, userID will identify the relevant portara tool (user) to pass portara settings to each other.  If user is unidentified, portara rate limiter will default to settings without the ability to modify directive settings without redeploying the APP that portara tool lives on
import portara from './portara/portaraSchemaDirective';

// typeDefs (for testing purposes only)
const typeDefs = gql`
  directive @portara(limit: Int!, per: ID!, throttle: ID!) on FIELD_DEFINITION | OBJECT

  type Query {
    test: String!
  }
  type Mutation @portara(limit: 7, per: 10, throttle: "1000ms") {
    hello: String!
    bye: String! @portara(limit: 3, per: 10, throttle: 0)
  }
`;

// Resolvers (for testing purposes only)
const resolvers = {
  Query: {
    test: (parent, args, context, info) => {
      return 'Test';
    },
  },
  Mutation: {
    hello: (parent, args, context, info) => {
      return 'Hello World';
    },
    bye: (parent, args, context, info) => {
      return 'Goodbye World';
    }, //
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  // Access req/res so that redis can store accurate information about each user. We use the IP address to keep track of which user has requested any given amount of times to a field/object
  context: ({ req, res }) => ({ req, res }),
  schemaDirectives: {
    portara: portara('e4ec56ad-4cbd-43ca-93af-a76fef9ae801'),
  },
});
// Start the server
server.listen({ port: 8080 }, () => {
  console.log(`Server running @ PORT 8080`);
});
