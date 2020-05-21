import { graphql } from 'graphql'
const { gql, makeExecutableSchema } = require('apollo-server')
import { IResolverValidationOptions } from 'graphql-tools'
import timeFrameMultiplier from '../portara/timeFrameMultiplier';
import portaraSchemaDirective from '../portara/portaraSchemaDirective'
const asyncRedis = require('async-redis');
const client = asyncRedis.createClient();

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

  it('Completes a query without directive', async  () => {
    const typeDefs = gql`
      directive @portara(limit: Int!, per: ID!) on FIELD_DEFINITION

      type Query {
        test: String!
      }
    `;

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
      resolverValidationOptions,
      schemaDirectives: {
        portara: portaraSchemaDirective
      }
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
    const timeFrame = timeFrameMultiplier('years')
    expect(timeFrame).toBeInstanceOf(Error)
  })


  it('defaults to 1 second when value is an empty string or undefined', () => {
    const timeFrame = timeFrameMultiplier(undefined || '')
    expect(timeFrame).toEqual(1000)
  })

  it('converts hours into milliseconds if the input is hours', () => {
    const timeFrame = timeFrameMultiplier('hours')
    expect(timeFrame).toEqual(3600000)
  })

  it('converts days into milliseconds if the input is days', () => {
    const timeFrame = timeFrameMultiplier('days')
    expect(timeFrame).toEqual(86400000)

  })
})


// Rate Limiter Redis Mock Testing -------------------------------------
describe('Redis connection and functionality are performing', () => {

  beforeAll(async () => {
    if (client.status === "end") {
      await client.connect()
    }
  });

  afterAll(async () => {
    await client.disconnect()
  });

  const IP = "123.4.5.67";

  // it('Receieves the IP Address', async () => {
  //   const response = await graphql(schema, 'mutation { hello }', null, { req: { ip: "127.0.0.13" } });
  //   console.log(context)
  // });

  // it('Receives the scope (Apollo Field Directive or Apollo Object)', async () => {
  //   // test
  // });

  it('Checks to see if the key exists in Redis', async () => {
    const key = IP + "_" + "Exists";
    await client.psetex(key, 10, 1);
    const redisGetValue = await client.exists(key);
    expect(redisGetValue).toBe(1); // Redis replies "1" if true

    const redisNotExistentKey = await client.exists("Nonexistent_Key");
    expect(redisNotExistentKey).toBe(0); // Redis replies "0" if false
  });
  // it('Checks to see if the key exists', async () => {
  //   const falsyResponse = client.get();
  //   expect(falsyResponse).toBeFalsy();
  //   client.set('truthyKey', 1);

  // });

  it('If key does not exists, sets the key value pair in Redis', async () => {
    const key = IP + "_" + "Nonexistent"
    const redisNotExistentKey = await client.exists("Nonexistent_Key");
    expect(redisNotExistentKey).toBe(0);
    if (redisNotExistentKey === 0) {
      await client.psetex(key, 10, 1)
    };
    const value = await client.get(key);
    await expect(value).toBe("1");
  });

  it('Expires the key', async () => {
    const key = IP + "_" + "Expires";
    // Set key: value with expiration
    await client.psetex(key, 100, 1);
    const existingKey = await client.exists(key)
    await expect(existingKey).toBe(1);

    function delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    await delay(500);
    const expiredKey = await client.exists(key);
    await expect(expiredKey).toBe(0);

  });

  it('If the key does exist, increments the value', async () => {
    const key = IP + "_" + "Increment";
    await client.psetex(key, 20, 1);
    await client.incr(key);
    const incrValue = await client.get(key);
    await expect(incrValue).toBe("2");
  });


});

// ---------------------------------------------------------------------

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
