import React from 'react';
import ApolloClient from 'apollo-boost';
import { ApolloProvider } from '@apollo/react-hooks';
import Test from './Test';


const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql'
})

function App(): JSX.Element {
  return (
    <ApolloProvider client={client}>
      <div className="App">
        <Test />
      </div>
    </ApolloProvider>
  );
}

export default App;
