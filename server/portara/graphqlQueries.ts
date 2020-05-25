// Query for subscription where userID is grabbed from server.ts (user enters manually)
export const subscr = `
subscription($userID: String!) {
  portaraSettings(userID: $userID) {
    name
    limit
    per
    throttle
  }
}
`;

// Mutation for sending the inital state of where the directive is being used to the database
export const initializerMutation = `
mutation ($userID: String!, $name: String!, $limit: ID!, $per: ID!, $throttle: ID!){
  changeSetting(userID: $userID, name: $name, limit: $limit, per: $per, throttle: $throttle) {
    name
    limit
    per
    throttle
  }
}
`;
