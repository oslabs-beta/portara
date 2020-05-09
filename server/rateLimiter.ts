const { SchemaDirectiveVisitor } = require('apollo-server');
import {
  defaultFieldResolver,
  GraphQLField,
  GraphQLObjectType,
} from 'graphql';

const asyncRedis = require('async-redis');
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
}