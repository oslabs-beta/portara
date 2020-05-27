const { SchemaDirectiveVisitor } = require('graphql-tools');
import { defaultFieldResolver, GraphQLField, GraphQLObjectType } from 'graphql';
const asyncRedis = require('async-redis');
const client = asyncRedis.createClient();
import rateLimiter from './rateLimiter';
import throttler from './throttler';
import timeFrameMultiplier from './timeFrameMultiplier';
import { GraphQLClient } from 'kikstart-graphql-client';
import { subscr, initializerMutation } from './graphqlQueries'
// import { userID } from '../server'
import { IUserSettings } from './interfaces';

// Create paths for both local testing and production. We only need to use these for triggering operations from nodejs.

// Here we check to see if the user has signed up for website. If they have, they should have entered their token as their userID in their server file to establish a connection.


export default function portara(userID?: string) {
  let userSettings: IUserSettings = {}; // update to be staging branch settings
  let graphQLClient = new GraphQLClient({
    // url: 'http://portara-web.herokuapp.com/graphql',
    // wsUrl: 'wss://portara-web.herokuapp.com/graphql',
    url: 'http://localhost:4000/graphql',
    wsUrl: 'ws://localhost:4000/graphql',
  });


  if (userID) {
    graphQLClient.runSubscription(subscr, { userID }).subscribe({
      next: (res) => {
        // Once a subscription is successfully established, we update userSettings to reflect what's in the database
        userSettings[res.data.portaraSettings.name] = res.data.portaraSettings
      },
      error: (error) => console.error('error', error),
    });
  }



  // Portara directive class
  return class portaraDirective extends SchemaDirectiveVisitor {

    // This error message is only for generating a response to a client when they exceed their limit (not for any other kind of errors)
    async generateErrorMessage(limit, per, name, ip) {
      const timeLeft = await client.ttl(`${ip}_${name}`);
      let error = `You have exceeded the request limit of ${limit} for the type(s) '${name}' . You have ${timeLeft} seconds left until the next request can be made.`;
      return error;
    }
    //FIELD_DEFINITION directive
    visitFieldDefinition(field: GraphQLField<any, any>, details) {
      // console.log(this)
      let { limit, per, throttle } = this.args;
      console.log('2')
      // we store the original resolver for later usage
      const { resolve = defaultFieldResolver } = field;
      // similar to the subscription connection, we check if token has been entered. if it has, we run a mutation to update the database with our current directives. This is only because a user shouldn't lose their code settings if they've been using offline version of the tool and then decide to sign up online
      if (userID) {
        graphQLClient.runMutation(initializerMutation, { userID, name: field.name, limit, per, throttle })
          // .then(res => console.log(res))
          .catch(err => console.log(err))
      }

      field.resolve = async (...originalArgs) => {
        const [object, args, context, info] = originalArgs;
        // if we've successfully pulled data from db, we update the userSettings and use those instead of original args
        // console.log(userID, userSettings)
        if (userSettings[info.fieldName]) {
          limit = userSettings[info.fieldName].limit;
          per = userSettings[info.fieldName].per;
          throttle = userSettings[info.fieldName].throttle;
        }
        // console.log('hit')
        // run rate limiter and check if it's ready to be triggered again
        const underLimit = await rateLimiter(limit, per, context.req.ip, info.fieldName);
        const perNum = parseFloat(throttle.match(/\d+/g)?.toString());
        const perWord = throttle
          .match(/[a-zA-Z]+/g)
          ?.toString()
          .toLowerCase();
        const throttled = <number>timeFrameMultiplier(perWord) * perNum;
        // activate throttler if setting is active and client exceeds limit
        if (!underLimit && throttled) {
          await throttler(throttled);
          return resolve(...originalArgs);
          // if no limit anymore, run resolver
        } else if (underLimit) {
          return resolve(...originalArgs);
          // if over limit but no throttler, return custom error message
        } else if (!underLimit) {
          const error = await this.generateErrorMessage(limit, per, info.fieldName, context.req.ip);
          return new Error(error);
        }
      };
    }

    // OBJECT directive
    visitObject(type: GraphQLObjectType) {
      let { limit, per, throttle } = this.args;
      const typeAsString = type.toString()
      // similar to the subscription connection, we check if token has been entered. if it has, we run a mutation to update the database with our current directives. This is only because a user shouldn't lose their code settings if they've been using offline version of the tool and then decide to sign up online
      if (userID) {
        graphQLClient.runMutation(initializerMutation, { userID, name: type, limit, per, throttle })
          // .then(res => console.log(res))
          .catch(err => console.log(err))
      }
      const fields = type.getFields();
      Object.values(fields).forEach((field) => {
        const { resolve = defaultFieldResolver } = field;
        if (!field.astNode!.directives!.some((directive) => directive.name.value === 'portara')) {
          field.resolve = async (...originalArgs) => {
            const [object, args, context, info] = originalArgs;
            // if we've successfully pulled data from db, we update the userSettings and use those instead of original args        
            if (userSettings[typeAsString]) {
              limit = userSettings[typeAsString].limit;
              per = userSettings[typeAsString].per;
              throttle = userSettings[typeAsString].throttle;
            }
            const underLimit = await rateLimiter(limit, per, context.req.ip, type.toString());

            const perNum = parseFloat(throttle.match(/\d+/g)?.toString());
            const perWord = throttle
              .match(/[a-zA-Z]+/g)
              ?.toString()
              .toLowerCase();
            const throttled = <number>timeFrameMultiplier(perWord) * perNum;
            // activate throttler if setting is active and client exceeds limit
            if (!underLimit && throttled) {
              await throttler(throttled);
              return resolve(...originalArgs);
              // if over limit but no throttler, return custom error message
            } else if (underLimit) {
              return resolve(...originalArgs);
              // if over limit but no throttler, return custom error message
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
}