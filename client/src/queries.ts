import { gql } from 'apollo-boost';

const getAllQuery = gql`
  {
    test
  }
`;

const HELLO_MUTATION = gql`
  mutation {
    hello
  }
`;

const BYE_MUTATION = gql`
  mutation {
    bye
  }
`;

export { HELLO_MUTATION, BYE_MUTATION };
