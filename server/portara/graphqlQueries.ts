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
