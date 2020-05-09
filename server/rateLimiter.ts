const { SchemaDirectiveVisitor } = require('apollo-server');
import {
  defaultFieldResolver,
  GraphQLField,
  GraphQLObjectType,
} from 'graphql';

const asyncRedis = require('async-redis');
const client = asyncRedis.createClient();

// Redis Rate Limiter -------------------------------------------
const rateLimiter = async (limit: number, per: string, ip: string, scope: string) => {

  // Per Functionality ---------------------------

  const perNum = Number(per.match(/\d+/g)?.toString()) 
  const perWord = per.match(/[a-zA-Z]+/g)?.toString().toLowerCase();

  const timeFrameMultiplier = (timeFrame) => {
    if (timeFrame === 'milliseconds' || timeFrame === 'millisecond' || timeFrame === 'mil' || timeFrame === 'mils' || timeFrame === 'ms') {
      return 0.001;
    } else if (timeFrame === 'seconds' || timeFrame === 'second' || timeFrame === 'sec' || timeFrame === 'secs' || timeFrame === 's') {
      return 1;
    } else if (timeFrame === 'minutes' || timeFrame === 'minute' || timeFrame === 'min' || timeFrame === 'mins' || timeFrame === 'm') {
      return 60;
    } else if (timeFrame === 'hours' || timeFrame === 'hour' || timeFrame === 'h') {
      return 60 * 60;
    } else if (timeFrame === 'days' || timeFrame === 'day' || timeFrame === 'd') {
      return 60 * 60 * 24;
    } else if (timeFrame === 'weeks' || timeFrame === 'week' || timeFrame === 'w') {
      return 60 * 60 * 24 * 7
    } else if (timeFrame === '' || timeFrame === undefined) {
      return 1;
    } else {
      return new Error('Not a valid measure of time!');
  }
}

  // get final result of expirationTimeVariable
  let expirationTimeVariable = ( <number> timeFrameMultiplier(perWord) * perNum);
  // ---------------------------------------------

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
    const { per } = this.args;
    const { resolve = defaultFieldResolver } = field;

    field.resolve = async (...originalArgs) => {
      const [object, args, context, info] = originalArgs;
      const underLimit = await rateLimiter(limit, per, context.req.ip, info.fieldName);
      if (underLimit) {
        return resolve( ...originalArgs);
      } else return new Error('Over Limit');
    };
    
  }

  visitObject(type: GraphQLObjectType) {
    const { limit } = this.args;
    const { per } = this.args;
    const fields = type.getFields();

    Object.values(fields).forEach((field) => {
      const { resolve = defaultFieldResolver } = field;
      if (!field.astNode!.directives!.some((directive) => directive.name.value === 'portara')) {
        field.resolve = async (...originalArgs) => {
          const [object, args, context, info] = originalArgs;
          const underLimit = await rateLimiter(limit, per, context.req.ip, type.toString());
          if (underLimit) {
            return resolve(...originalArgs);
          } else return new Error('Over Limit');
        };
      }
    });
  }
}