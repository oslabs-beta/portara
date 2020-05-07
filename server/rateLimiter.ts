const { ApolloServer, SchemaDirectiveVisitor } = require('apollo-server');
import {
  defaultFieldResolver,
  GraphQLField,
  GraphQLObjectType,
  GraphQLResolveInfo,
  GraphQLError,
} from 'graphql';

// let count: number = 5;

// export const rateLimiter = (requestContext: any, responseContext: any, options: any = {
//   requestLimit: 10,
//   throttleSetting: null,
//   timer: 20,
// }) => {
//   count++;
//   console.log(requestContext.context.req.ip)
//   if (count >= options.requestLimit) {
//     throw new Error(`Request limit exceeded. Try again in ${options.timer} minutes`)
//   }
//   console.log(count)
// }

const rateLimiter = (limit: number) => {
  let count: number = 0;
  return function () {
    if (count === limit) {
      throw new Error("nope, you've exceeded your requests");
    }
    count += 1;
    console.log(count);
  };
};

export class portaraSchemaDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field: GraphQLField<any, any>, details) {
    // console.log(field.astNode.directives[0].name);
    const { limit } = this.args;
    const fields = details.objectType.getFields();

    const variables = {};
    for (let field in fields) {
      variables[field] = fields[field].resolve;
      variables[`rateLimiter-${field}`] = rateLimiter(limit);
    }

    field.resolve = (object, args, context, info) => {
      // console.log('FIELD: ', field);
      variables[`rateLimiter-${info.fieldName}`]();
      return variables[info.fieldName]();
    };
  }
  visitObject(type: GraphQLObjectType) {
    const { limit } = this.args;
    const fields = type.getFields();

    const variables = {};
    const func = rateLimiter(limit);

    Object.values(fields).forEach((field) => {
      if (!field.astNode!.directives!.some((directive) => directive.name.value === 'portara')) {
        variables[field.name] = field.resolve;
        field.resolve = (object, args, context, info) => {
          func();
          return variables[field.name]();
        };
      }
    });
  }
}