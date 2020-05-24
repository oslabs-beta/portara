const { SchemaDirectiveVisitor }: any = require('graphql-tools');
import { defaultFieldResolver, GraphQLField, GraphQLObjectType } from 'graphql';
const asyncRedis = require('async-redis');
const client = asyncRedis.createClient();
import rateLimiter from './rateLimiter';
import throttler from './throttler';
import timeFrameMultiplier from './timeFrameMultiplier';
// import { userSettings } from './subscriber'
import { GraphQLClient } from 'kikstart-graphql-client';
import { subscr, initializerMutation } from './graphqlQueries'
import { userID } from '../server'
import { IUserSettings } from './interfaces';

let userSettings: IUserSettings = {};

// graphQLClient connects server to server communication
const graphQLClient = new GraphQLClient({
  // url: 'http://portara-web.herokuapp.com/graphql',
  // wsUrl: 'wss://portara-web.herokuapp.com/graphql',
  url: 'http://localhost:4000/graphql',
  wsUrl: 'ws://localhost:4000/graphql',
});

if (userID) {
  graphQLClient.runSubscription(subscr, { userID }).subscribe({
    next: (res) => {
      userSettings = res.data.portaraSettings
      console.log(userSettings)
    },
    error: (error) => console.error('error', error),
    complete: () => console.log('done'),
  });


  // graphQLClient.runMutation(initializerMutation, { userID, name: "bye", limit: "20", per: "15", throttle: "1" }).then(res => console.log(res))




}

export class portaraSchemaDirective extends SchemaDirectiveVisitor {

  async generateErrorMessage(limit, per, name, ip) {
    const timeLeft = await client.ttl(`${ip}_${name}`);
    let error = `You have exceeded the request limit of ${limit} for the type(s) '${name}' . You have ${timeLeft} seconds left until the next request can be made.`;
    return error;
  }

  visitFieldDefinition(field: GraphQLField<any, any>, details) {
    let { limit, per, throttle } = this.args;
    const { resolve = defaultFieldResolver } = field;

    if (userID) {
      graphQLClient.runMutation(initializerMutation, { userID, name: field.name, limit, per, throttle })
        .then(res => console.log(res))
        .catch(err => console.log(err))
    }

    field.resolve = async (...originalArgs) => {

      if (userSettings.limit && userSettings.per && userSettings.throttle) {
        limit = userSettings.limit;
        per = userSettings.per;
        throttle = userSettings.throttle;
      }

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
    let { limit, per, throttle } = this.args;
    const fields = type.getFields();
    Object.values(fields).forEach((field) => {
      const { resolve = defaultFieldResolver } = field;
      if (!field.astNode!.directives!.some((directive) => directive.name.value === 'portara')) {
        field.resolve = async (...originalArgs) => {

          if (userSettings.limit && userSettings.per && userSettings.throttle) {
            limit = userSettings.limit;
            per = userSettings.per;
            throttle = userSettings.throttle;
          }
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
