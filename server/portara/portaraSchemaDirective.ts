const { SchemaDirectiveVisitor }: any = require('graphql-tools');
import { defaultFieldResolver, GraphQLField, GraphQLObjectType } from 'graphql';
const asyncRedis = require('async-redis');
const client = asyncRedis.createClient();
import rateLimiter from './rateLimiter';
import throttler from './throttler';
import timeFrameMultiplier from './timeFrameMultiplier';
import { userSettings } from './subscriber'

export default class portaraSchemaDirective extends SchemaDirectiveVisitor {
  // trigger PubSub here so that it triggers on server start only

  async generateErrorMessage(limit, per, name, ip) {
    const timeLeft = await client.ttl(`${ip}_${name}`);
    let error = `You have exceeded the request limit of ${limit} for the type(s) '${name}' . You have ${timeLeft} seconds left until the next request can be made.`;
    return error;
  }

  visitFieldDefinition(field: GraphQLField<any, any>, details) {
    let { limit, per, throttle } = this.args;
    const { resolve = defaultFieldResolver } = field;
    field.resolve = async (...originalArgs) => {
      limit = userSettings.limit;
      per = userSettings.per;
      throttle = userSettings.throttle;
      console.log(limit, per, throttle)
      const [object, args, context, info] = originalArgs;
      const underLimit = await rateLimiter(limit, per, context.req.ip, info.fieldName);
      const perNum = parseFloat(<any>throttle.match(/\d+/g)?.toString());
      const perWord = throttle
        .match(/[a-zA-Z]+/g)
        ?.toString()
        .toLowerCase();
      const throttled = <any>timeFrameMultiplier(perWord) * perNum;

      if (!underLimit && throttled) {
        await throttler(throttled);
        return resolve(...originalArgs);
      } else if (underLimit) {
        return resolve(...originalArgs);
      } else if (!underLimit) {
        const error = await this.generateErrorMessage(limit, per, info.fieldName, context.req.ip);
        return new Error(error);
      }
    };
  }

  visitObject(type: GraphQLObjectType) {
    const { limit, per, throttle } = this.args;
    const fields = type.getFields();
    Object.values(fields).forEach((field) => {
      const { resolve = defaultFieldResolver } = field;
      if (!field.astNode!.directives!.some((directive) => directive.name.value === 'portara')) {
        field.resolve = async (...originalArgs) => {
          const [object, args, context, info] = originalArgs;
          const underLimit = await rateLimiter(limit, per, context.req.ip, type.toString());

          const perNum = parseFloat(<any>throttle.match(/\d+/g)?.toString());
          const perWord = throttle
            .match(/[a-zA-Z]+/g)
            ?.toString()
            .toLowerCase();
          const throttled = <any>timeFrameMultiplier(perWord) * perNum;

          if (!underLimit && throttled) {
            await throttler(throttled);
            return resolve(...originalArgs);
          } else if (underLimit) {
            return resolve(...originalArgs);
          } else if (!underLimit) {
            const error = await this.generateErrorMessage(
              limit,
              per,
              type.toString(),
              context.req.ip
            );
            return new Error(error);
          }
        };
      }
    });
  }
}
