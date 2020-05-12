import { graphql } from 'graphql'
import { gql, SchemaDirectiveVisitor } from 'apollo-server'
import { makeExecutableSchema, IResolverValidationOptions } from 'graphql-tools'
import { portaraSchemaDirective, rateLimiter, timeFrameMultiplier } from '../rateLimiter';

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

describe('Rate Limiter accepts various timeframe values', () => {
  it('returns an error when input value is not recognized', () => {
    const timeframe = timeFrameMultiplier('years')
    expect(timeframe).toBeInstanceOf(Error)
  })

  it('defaults to 1 second when value is an empty string', ()=> {
    const timeframe = timeFrameMultiplier('')
    expect(timeframe).toEqual(1000)
  })



})