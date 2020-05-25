const { ApolloServer, gql } = require('apollo-server');
// For Server to Server GraphQL communication, userID will identify the relevant portara tool (user) to pass portara settings to each other.  If user is unidentified, portara rate limiter will default to settings without the ability to modify directive settings without redeploying the APP that portara tool lives on
export let userID = '5ec9aa3a9057a222f161be33'
import portaraSchemaDirective from './portara/portaraSchemaDirective';

// typeDefs (for testing purposes only)
const typeDefs = gql`
  directive @portara(limit: Int! = 10, per: ID! = 10, throttle: ID! = 0) on FIELD_DEFINITION | OBJECT

  type Query {
    test: String!
  }
  type Mutation @portara(limit: 4, per: 10, throttle: "500ms") {
    hello: String! @portara
    bye: String!
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
  // Access req/res so that redis can store accurate information about each user. We use the IP address to keep track of which user has requested any given amount of times to a field/object
  context: ({ req, res }) => ({ req, res }),
  schemaDirectives: {
    portara: portaraSchemaDirective,
  },
});
// Start the server
server.listen({ port: 8080 }, () => {
  console.log(`Server running @ PORT 8080`);
});
