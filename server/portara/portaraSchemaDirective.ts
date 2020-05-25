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

// initialize userSettings to an empty object
// let userSettings: IUserSettings = {};

// Create paths for both local testing and production. We only need to use these for triggering operations from nodejs.
// const graphQLClient = new GraphQLClient({
//   // url: 'http://portara-web.herokuapp.com/graphql',
//   // wsUrl: 'wss://portara-web.herokuapp.com/graphql',
//   url: 'http://localhost:4000/graphql',
//   wsUrl: 'ws://localhost:4000/graphql',
// });

// Here we check to see if the user has signed up for website. If they have, they should have entered their token as their userID in their server file to establish a connection.


export default function portara(userID?: string) {


  let userSettings: IUserSettings = {};
  let graphQLClient = new GraphQLClient({
    // url: 'http://portara-web.herokuapp.com/graphql',
    // wsUrl: 'wss://portara-web.herokuapp.com/graphql',
    url: 'http://localhost:4000/graphql',
    wsUrl: 'ws://localhost:4000/graphql',
  });


  // establishSubscription() {
  if (userID) {
    graphQLClient.runSubscription(subscr, { userID }).subscribe({
      next: (res) => {
        // Once a subscription is successfully established, we update userSettings to reflect what's in the database
        userSettings = res.data.portaraSettings
      },
      error: (error) => console.error('error', error),
    });
  }
  // }


  // Portara directive class
  return class extends SchemaDirectiveVisitor {
    // This error message is only for generating a response to a client when they exceed their limit (not for any other kind of errors)
    async generateErrorMessage(limit, per, name, ip) {
      const timeLeft = await client.ttl(`${ip}_${name}`);
      let error = `You have exceeded the request limit of ${limit} for the type(s) '${name}' . You have ${timeLeft} seconds left until the next request can be made.`;
      return error;
    }
    //FIELD_DEFINITION directive
    visitFieldDefinition(field: GraphQLField<any, any>, details) {
      let { limit, per, throttle } = this.args;

      // we store the original resolver for later usage
      const { resolve = defaultFieldResolver } = field;
      // similar to the subscription connection, we check if token has been entered. if it has, we run a mutation to update the database with our current directives. This is only because a user shouldn't lose their code settings if they've been using offline version of the tool and then decide to sign up online
      if (userID) {
        graphQLClient.runMutation(initializerMutation, { userID, name: field.name, limit, per, throttle })
          .then(res => console.log(res))
          .catch(err => console.log(err))
      }

      field.resolve = async (...originalArgs) => {
        // if we've successfully pulled data from db, we update the userSettings and use those instead of original args
        console.log(userID, userSettings)
        if (userSettings.limit && userSettings.per && userSettings.throttle) {
          limit = userSettings.limit;
          per = userSettings.per;
          throttle = userSettings.throttle;
        }
        console.log('hit')
        const [object, args, context, info] = originalArgs;
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
      // similar to the subscription connection, we check if token has been entered. if it has, we run a mutation to update the database with our current directives. This is only because a user shouldn't lose their code settings if they've been using offline version of the tool and then decide to sign up online
      if (userID) {
        graphQLClient.runMutation(initializerMutation, { userID, name: type, limit, per, throttle })
          .then(res => console.log(res))
          .catch(err => console.log(err))
      }
      const fields = type.getFields();
      Object.values(fields).forEach((field) => {
        const { resolve = defaultFieldResolver } = field;
        if (!field.astNode!.directives!.some((directive) => directive.name.value === 'portara')) {
          field.resolve = async (...originalArgs) => {
            // if we've successfully pulled data from db, we update the userSettings and use those instead of original args
            if (userSettings.limit && userSettings.per && userSettings.throttle) {
              limit = userSettings.limit;
              per = userSettings.per;
              throttle = userSettings.throttle;
            }
            const [object, args, context, info] = originalArgs;
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


// // Portara directive class
// export default class portaraSchemaDirective extends SchemaDirectiveVisitor {
//   // This error message is only for generating a response to a client when they exceed their limit (not for any other kind of errors)
//   async generateErrorMessage(limit, per, name, ip) {
//     const timeLeft = await client.ttl(`${ip}_${name}`);
//     let error = `You have exceeded the request limit of ${limit} for the type(s) '${name}' . You have ${timeLeft} seconds left until the next request can be made.`;
//     return error;
//   }
//   //FIELD_DEFINITION directive
//   visitFieldDefinition(field: GraphQLField<any, any>, details) {
//     let { limit, per, throttle } = this.args;
//     // we store the original resolver for later usage
//     const { resolve = defaultFieldResolver } = field;
//     // similar to the subscription connection, we check if token has been entered. if it has, we run a mutation to update the database with our current directives. This is only because a user shouldn't lose their code settings if they've been using offline version of the tool and then decide to sign up online
//     if (userID) {
//       graphQLClient.runMutation(initializerMutation, { userID, name: field.name, limit, per, throttle })
//         .then(res => console.log(res))
//         .catch(err => console.log(err))
//     }

//     field.resolve = async (...originalArgs) => {
//       // if we've successfully pulled data from db, we update the userSettings and use those instead of original args
//       if (userSettings.limit && userSettings.per && userSettings.throttle) {
//         limit = userSettings.limit;
//         per = userSettings.per;
//         throttle = userSettings.throttle;
//       }

//       const [object, args, context, info] = originalArgs;
//       // run rate limiter and check if it's ready to be triggered again
//       const underLimit = await rateLimiter(limit, per, context.req.ip, info.fieldName);
//       const perNum = parseFloat(throttle.match(/\d+/g)?.toString());
//       const perWord = throttle
//         .match(/[a-zA-Z]+/g)
//         ?.toString()
//         .toLowerCase();
//       const throttled = <number>timeFrameMultiplier(perWord) * perNum;
//       // activate throttler if setting is active and client exceeds limit
//       if (!underLimit && throttled) {
//         await throttler(throttled);
//         return resolve(...originalArgs);
//         // if no limit anymore, run resolver
//       } else if (underLimit) {
//         return resolve(...originalArgs);
//         // if over limit but no throttler, return custom error message
//       } else if (!underLimit) {
//         const error = await this.generateErrorMessage(limit, per, info.fieldName, context.req.ip);
//         return new Error(error);
//       }
//     };
//   }

//   // OBJECT directive
//   visitObject(type: GraphQLObjectType) {
//     let { limit, per, throttle } = this.args;
//     // similar to the subscription connection, we check if token has been entered. if it has, we run a mutation to update the database with our current directives. This is only because a user shouldn't lose their code settings if they've been using offline version of the tool and then decide to sign up online
//     if (userID) {
//       graphQLClient.runMutation(initializerMutation, { userID, name: type, limit, per, throttle })
//         .then(res => console.log(res))
//         .catch(err => console.log(err))
//     }
//     const fields = type.getFields();
//     Object.values(fields).forEach((field) => {
//       const { resolve = defaultFieldResolver } = field;
//       if (!field.astNode!.directives!.some((directive) => directive.name.value === 'portara')) {
//         field.resolve = async (...originalArgs) => {
//           // if we've successfully pulled data from db, we update the userSettings and use those instead of original args
//           if (userSettings.limit && userSettings.per && userSettings.throttle) {
//             limit = userSettings.limit;
//             per = userSettings.per;
//             throttle = userSettings.throttle;
//           }
//           const [object, args, context, info] = originalArgs;
//           const underLimit = await rateLimiter(limit, per, context.req.ip, type.toString());

//           const perNum = parseFloat(throttle.match(/\d+/g)?.toString());
//           const perWord = throttle
//             .match(/[a-zA-Z]+/g)
//             ?.toString()
//             .toLowerCase();
//           const throttled = <number>timeFrameMultiplier(perWord) * perNum;
//           // activate throttler if setting is active and client exceeds limit
//           if (!underLimit && throttled) {
//             await throttler(throttled);
//             return resolve(...originalArgs);
//             // if over limit but no throttler, return custom error message
//           } else if (underLimit) {
//             return resolve(...originalArgs);
//             // if over limit but no throttler, return custom error message
//           } else if (!underLimit) {
//             const error = await this.generateErrorMessage(
//               limit,
//               per,
//               type.toString(),
//               context.req.ip
//             );
//             return new Error(error);
//           }
//         };
//       }
//     });
//   }
// }
