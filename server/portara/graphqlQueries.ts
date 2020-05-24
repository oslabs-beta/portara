import { gql } from 'apollo-server-express';

export const subscr = gql`
subscription($userID: String!) {
  portaraSettings(userID: $userID) {
    name
    limit
    per
    throttle
  }
}
`;

export const initializerMutation = gql`
  mutation($userID: String!, $name: String!, $limit: ID!!, $per: ID!, $throttle: ID!) {
    portaraSettings(userID: $userID!, name: $name, limit: $limit!, per: $per!, throttle: $throttle!) {
      name
      limit
      per
      throttle
    }
  }
`;
