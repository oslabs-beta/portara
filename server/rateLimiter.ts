const { ApolloServer, SchemaDirectiveVisitor } = require('apollo-server');
import {
  defaultFieldResolver,
  GraphQLField,
  GraphQLObjectType,
  GraphQLResolveInfo,
  GraphQLError,
  GraphQLSchema,
  GraphQLType,
  GraphQLNamedType,
} from 'graphql';
import { type } from 'os';
const asyncRedis = require('async-redis');
const redis = require('redis');
const client = asyncRedis.createClient();

// Redis Rate Limiter -------------------------------------------
const rateLimiter = async (limit: number, ip: string, scope: string) => {
  const expirationTimeVariable = 20; // NEED TO CHANGE
  const key = ip + '_' + scope;

  let exists = await client.exists(key);

  if (exists === 0) {
    await client.setex(key, expirationTimeVariable, 1);
    return true;
  } else {
    await client.incr(key);
    let value = await client.get(key);
    value = Number(value);

    return value > limit ? false : true;
  }
};
//---------------------------------------------------------------

export class portaraSchemaDirective extends SchemaDirectiveVisitor {

  visitFieldDefinition(field: GraphQLField<any, any>, details) {
    const { limit } = this.args;
    const { resolve = defaultFieldResolver } = field;

    field.resolve = async (...originalArgs) => {
      const [object, args, context, info] = originalArgs;
      const underLimit = await rateLimiter(limit, context.req.ip, info.fieldName);
      if (underLimit) {
        return resolve( ...originalArgs);
      } else return new Error('Over Limit');
    };
    
  }

  visitObject(type: GraphQLObjectType) {
    const { limit } = this.args;
    const fields = type.getFields();
    // console.log(fields)

    Object.values(fields).forEach((field) => {
      const { resolve = defaultFieldResolver } = field;
      
      if (!field.astNode!.directives!.some((directive) => directive.name.value === 'portara')) {

        field.resolve = async (...originalArgs) => {
          const [object, args, context, info] = originalArgs;
          const underLimit = await rateLimiter(limit, context.req.ip, type.toString());
          if (underLimit) {
            return resolve(...originalArgs);
          } else return new Error('Over Limit');
        };
      }
    });
  }

  // visitSchema(schema: GraphQLSchema) {
  //   const { limit } = this.args;
  //   const allTypes = {};
  //   Object.assign(
  //     allTypes,
  //     schema.getQueryType()?.getFields(),
  //     schema.getMutationType()?.getFields(),
  //     schema.getSubscriptionType()?.getFields()
  //   );
  //   // console.log(allTypes)

  //   Object.values(allTypes).forEach((field: any) => {
  //     const { resolve = defaultFieldResolver } = field;
  //     field.resolve = async (parent, args, context, info) => {

  //       // Rate Limiter Check -------------------------------
  //       const SchemaLimit = await rateLimiter(limit, context.req.ip, 'Schema');
  //       if (SchemaLimit) {
  //         console.log('schemafire')
  //         return resolve(parent, args, context, info);
  //       } else return new Error('Over Limit');
  //     };
  //   });
  // }

  /*
  const visitQueue = []

  const visitFieldDefinitionQueue = () => {
    // whole function here
  };

  const visitObjectQueue = () => {
    // whole function here
  };

  const visitSchemaQueue = () => {
    // whole function here
  };

  visitQueue.push(visitFieldDefinitionQueue, visitObjectQueue, visitSchemaQueue)

  for (let visitFunction of visitQueue) {
    visitFunction()
  };

  this should get us to fire off in the order we want manually

  */


  // Object.values(allTypes).forEach((field: any) => {

  //   if (!field.astNode!.directives!.some((directive) => directive.name.value === 'portara')) {
  //     if (field.resolve) {
  //       console.log('schema level', this.context)
  //       this.context[field.name] = field.resolve;

  //       if (!this.context[field.name]) {
  //         console.log('hit')
  //         field.resolve = async (...originalArgs) => {
  //           const [object, args, context, info] = originalArgs;
  //           const underLimit = await rateLimiter(limit, context.req.ip, 'Schema');
  //           if (underLimit) {
  //             return this.context[field.name](...originalArgs);
  //           } else return new Error('Over Limit');

  //         };
  //       }
  //     }
  //   }

  // });
}

// Redis Connection:
/*
Endpoint:
redis-11068.c98.us-east-1-4.ec2.cloud.redislabs.com:11068
In Terminal:
redis-cli -h redis-11068.c98.us-east-1-4.ec2.cloud.redislabs.com -p 11068 -a cats35_ql
*/
