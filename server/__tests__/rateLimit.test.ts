import { graphql } from 'graphql'
import { gql, SchemaDirectiveVisitor } from 'apollo-server'
import { makeExecutableSchema, IResolverValidationOptions } from 'graphql-tools'
import { portaraSchemaDirective, rateLimiter } from '../rateLimiter';
const redis = require('redis-mock');
const client = redis.createClient();

// Globally allows resolvers to not exist in the original schema
const resolverValidationOptions: IResolverValidationOptions = {
  allowResolversNotInSchema: true
};
// -------------------------------------------------------------

describe('Receives a response from our GraphQL Query', () => {

  const resolvers = {
    Query: {
      test: (parent, args, context, info) => {
        return 'Test'
      }
    },
    Mutation: {
      hello: (parent, args, context, info) => {
        return 'Hello World';
      },
      bye: (parent, args, context, info) => {
        return 'Goodbye World';
      },
    },
  };

  it('Completes a query without directive', async () => {
    const typeDefs = gql`
      type Query {
        test: String!
      }
    `;

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
      resolverValidationOptions,
    })

    const response = await graphql(schema, 'query { test }');
    expect(response.data!.test).toBe("Test")
  })

  it('Completes a mutation', async () => {
    const typeDefs = gql`
      type Query {
        test: String!
      }
      type Mutation {
        hello: String!
      }
    `;

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
      resolverValidationOptions
    })

    const response = await graphql(schema, 'mutation { hello }');
    expect(response.data!.hello).toBe("Hello World");
  })
})

// Rate Limiter Redis Mock Testing -------------------------------------
describe('Key : Value Pairs are stored correctly in Redis', () => {

  it('Receieves the IP Address', async () => {
    // test
  });

  it('Receives the scope (Apollo Field Directive or Apollo Object)', async () => {
    // test
  });

  it('Checks to see if the key exists', async () => {

  });

  it('If key does not exists, sets the key value pair in Redis', async () => {

  });

  it('Expires the key', async () => {

  });

  it('If the key does exist, increments the value', async () => {

  });

  it('Gets the value for the correct key', async () => {

  });

  it('Compares the value to the limit correctly', async () => {

  });

});

// ---------------------------------------------------------------------