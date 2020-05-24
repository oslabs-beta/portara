const { ApolloServer, gql } = require('apollo-server');
export let userID = '5ec9aa3a9057a222f161be33'
import { portaraSchemaDirective } from './portara/portaraSchemaDirective';




// typeDefs
const typeDefs = gql`
  directive @portara(limit: Int!, per: ID!, throttle: ID!) on FIELD_DEFINITION | OBJECT

  type Query {
    test: String!
  }
  type Mutation @portara(limit: 4, per: 10, throttle: "500ms") {
    hello: String! @portara(limit: 2, per: "20 seconds", throttle: "0")
    bye: String! @portara(limit: 2, per: "20 seconds", throttle: "0")
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


const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req, res }) => ({ req, res }),
  schemaDirectives: {
    portara: portaraSchemaDirective,
  },
});

server.listen({ port: 8080 }, () => {
  console.log(`Server running @ PORT 8080`);
});
