import { graphql } from 'graphql'
const { gql, makeExecutableSchema } = require('apollo-server')
import { IResolverValidationOptions } from 'graphql-tools'
import portaraSchemaDirective from '../mockDirective'


// Globally allows resolvers to not exist in the original schema
const resolverValidationOptions: IResolverValidationOptions = {
  allowResolversNotInSchema: true
};

// ----------------------------------------------------------------------
//    GraphQL Directive (Portara) using a throttler applied to TypeDefs
// ----------------------------------------------------------------------

describe('test to see if throttler returns the correct value at the right time when decorating @portara on field or an object', () => {

  const typeDefs = gql`
  directive @portara(limit: Int!, per: ID!, throttle: ID!) on FIELD_DEFINITION | OBJECT 

  type Query {
    test: String!
  }
  type Mutation @portara(limit: 4, per: 8, throttle: "1s") {
    add: Int! @portara(limit: 2, per: "8 seconds", throttle: "1s")
    minus: Int! 
  }
`;
  let addCounter = 0;
  let minusCounter = 5;
  const resolvers = {
    Query: {
      test: (parent, args, context, info) => {
        return 'Test'
      }
    },
    Mutation: {
      add: (parent, args, context, info) => {
        return addCounter += 1;
      },
      minus: (parent, args, context, info) => {
        return minusCounter -= 1;
      },
    },
  };

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
    resolverValidationOptions,
    schemaDirectives: {
      portara: portaraSchemaDirective,
    },
  })

  it('field resolver should throttle 1 time after hitting the limit, time taken should be greater than or equal to 1000', async () => {
    const t0 = performance.now()
    await graphql(schema, 'mutation { add }', null, { req: { ip: "127.0.0.22" } });
    await graphql(schema, 'mutation { add }', null, { req: { ip: "127.0.0.22" } });
    const response = await graphql(schema, 'mutation { add }', null, { req: { ip: "127.0.0.22" } });
    expect(response.data!.add).toBe(3)
    const t1 = performance.now()
    expect(t1 - t0).toBeGreaterThanOrEqual(1000)

  })

  it('object resolver should throttle 2 times after hitting the limit, time taken should be greater than or equal to 2000', async () => {
    const t0 = performance.now()
    for (let i = 0; i < 5; i++) {
      await graphql(schema, 'mutation { minus }', null, { req: { ip: "127.0.0.22" } });
    }
    const response = await graphql(schema, 'mutation { minus }', null, { req: { ip: "127.0.0.22" } });
    expect(response.data!.minus).toBe(-1)
    const t1 = performance.now()
    expect(t1 - t0).toBeGreaterThanOrEqual(2000)
  })


})
