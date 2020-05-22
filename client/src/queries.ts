import { gql } from 'apollo-boost';

const getAllQuery = gql`
  {
    test
  }
`;

const addTestMutation = gql`
  mutation {
    hello
  }
`;

const testSubscribe = gql`
  subscription {
    testSub
  }
`;

export { getAllQuery, addTestMutation, testSubscribe };
