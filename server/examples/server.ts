const { ApolloServer, gql } = require('apollo-server');
import { portaraSchemaDirective } from '../rateLimiter';

// typeDefs
const typeDefs = gql`
  directive @portara(limit: Int!, per: String!) on FIELD_DEFINITION | OBJECT 

  type Query {
    test: String!
  }
  type Mutation  @portara(limit: 8, per: "10 seconds") { #object level rate limiting
    hello: String! @portara(limit: 2, per: "5s") #field level rate limiting. example: can also be 5 sec/secs/second/seconds with or without space
    bye: String! 
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
