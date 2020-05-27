import { graphql } from 'graphql'
const { gql, makeExecutableSchema } = require('apollo-server')
import { IResolverValidationOptions } from 'graphql-tools'
import portaraSchemaDirective from '../mockDirective'


// Globally allows resolvers to not exist in the original schema
const resolverValidationOptions: IResolverValidationOptions = {
  allowResolversNotInSchema: true
};

// -------------------------------------------------------------
//    Normal GraphQL Query & Mutation
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

// ----------------------------------------------------------------------
//   GraphQL Directive (Portara) using a rate limiter applied to TypeDefs
// ----------------------------------------------------------------------
describe('test to see if rate limiter returns the correct value or the expected error message when decorating @portara on field or an object', () => {

  const typeDefs = gql`
  directive @portara(limit: Int!, per: ID!, throttle: ID!) on FIELD_DEFINITION | OBJECT 

  type Query {
    test: String!
  }
  type Mutation @portara(limit: 4, per: 4, throttle: 0) {
    hello: String! @portara(limit: 2, per: "4", throttle: 0)
    bye: String! 
  }
`;
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

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
    resolverValidationOptions,
    schemaDirectives: {
      portara: portaraSchemaDirective,
    },
  })

  it('directive is applied to field', () => {
    expect(typeDefs.definitions[2].fields[0].name.value).toBe('hello')
    expect(typeDefs.definitions[2].fields[0].directives[0].name.value).toBe('portara')
  })

  it('directive is applied to object', () => {
    expect(typeDefs.definitions[2].name.value).toBe('Mutation')
    expect(typeDefs.definitions[2].directives[0].name.value).toBe('portara')
  })

  it('field resolver should return original return value', async () => {
    const response1 = await graphql(schema, 'mutation { hello }', null, { req: { ip: "127.0.0.13" } });
    expect(response1.data!.hello).toBe("Hello World");
  })

  it('object resolvers return correct value', async () => {

    const response1 = await graphql(schema, 'mutation { bye }', null, { req: { ip: "127.0.0.15" } })
    expect(response1.data!.bye).toBe("Goodbye World");
  })

  it('field resolver should return error when exceeding limit', async () => {
    await graphql(schema, 'mutation { hello }', null, { req: { ip: "127.0.0.13" } });
    const response3 = await graphql(schema, 'mutation { hello }', null, { req: { ip: "127.0.0.13" } });
    expect(response3.errors![0].message).toContain('You have exceeded');
  })

  it('field resolver should work for different user IP', async () => {
    const response1 = await graphql(schema, 'mutation { hello }', null, { req: { ip: "127.0.0.14" } });
    expect(response1.data!.hello).toBe("Hello World");
  })

  it('field resolver should return error message when exceeding limit with different IP', async () => {
    for (let i = 0; i < 4; i++) {
      await graphql(schema, 'mutation { hello }', null, { req: { ip: "127.0.0.14" } });
    }
    const response3 = await graphql(schema, 'mutation { hello }', null, { req: { ip: "127.0.0.14" } });
    expect(response3.errors![0].message).toContain('You have exceeded');
  })


  it('object resolver should return error message when exceeding limit', async () => {
    for (let i = 0; i < 4; i++) {
      await graphql(schema, 'mutation { bye }', null, { req: { ip: "127.0.0.10" } });
    }
    const didWeLogError = await graphql(schema, 'mutation { bye }', null, { req: { ip: "127.0.0.10" } });

    expect(didWeLogError.errors![0].message).toContain('You have exceeded');
  })
})


