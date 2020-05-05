import { gql } from 'apollo-boost';

const getAllQuery = gql`
  {
    tests {
      name
    }
  }
`;

const addTestMutation = gql`
  mutation {
    hello
  }
`;

export { getAllQuery, addTestMutation };
