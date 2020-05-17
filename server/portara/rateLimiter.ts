const { SchemaDirectiveVisitor }: any = require('apollo-server');
import {
  defaultFieldResolver,
  GraphQLField,
  GraphQLObjectType,
} from 'graphql';

const asyncRedis = require('async-redis');
const client = asyncRedis.createClient();
import timeFrameMultiplier from './timeFrameMultiplier'

// Redis Rate Limiter -------------------------------------------
export const rateLimiter = async (limit: number, per: string, ip: string, scope: string) => {

  // Per Functionality ---------------------------

  const perNum = parseFloat(<any>per.match(/\d+/g)?.toString())
  const perWord = per.match(/[a-zA-Z]+/g)?.toString().toLowerCase();


  // get final result of expirationTimeVariable
  let expirationTimeVariable = (<number>timeFrameMultiplier(perWord) * perNum);
  // ---------------------------------------------

  const key = ip + '_' + scope;

  let exists = await client.exists(key);

  if (exists === 0) {
    await client.psetex(key, expirationTimeVariable, 1);
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

  async generateErrorMessage(limit, per, name, ip) {
    const timeLeft = await client.ttl(`${ip}_${name}`)
    let error = `You have exceeded the request limit of ${limit} for the type(s) '${name}' . You have ${timeLeft} seconds left until the next request can be made.`;
    return error;
  }



  visitFieldDefinition(field: GraphQLField<any, any>, details) {
    const { limit, per } = this.args;
    const { resolve = defaultFieldResolver } = field;
    field.resolve = async (...originalArgs) => {
      const [object, args, context, info] = originalArgs;
      const error = await this.generateErrorMessage(limit, per, info.fieldName, context.req.ip)
      const underLimit = await rateLimiter(limit, per, context.req.ip, info.fieldName);
      if (underLimit) {
        return resolve(...originalArgs);
      } else {
        const error = await this.generateErrorMessage(limit, per, info.fieldName, context.req.ip)
        return new Error(error)
      };
    };
  }

  visitObject(type: GraphQLObjectType) {
    const { limit, per } = this.args;
    const fields = type.getFields();
    Object.values(fields).forEach((field) => {
      const { resolve = defaultFieldResolver } = field;
      if (!field.astNode!.directives!.some((directive) => directive.name.value === 'portara')) {
        field.resolve = async (...originalArgs) => {
          const [object, args, context, info] = originalArgs;
          const underLimit = await rateLimiter(limit, per, context.req.ip, type.toString());
          if (underLimit) {
            return resolve(...originalArgs);
          } else {
            const error = await this.generateErrorMessage(limit, per, type.toString(), context.req.ip)
            return new Error(error)
          };
        };
      }
    });
  }
}