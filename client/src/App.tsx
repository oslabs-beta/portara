import React from 'react';
import ApolloClient from 'apollo-boost';
import { ApolloProvider } from '@apollo/react-hooks';
import Test from './Test';
import './App.css';

const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql'
})

function App(): JSX.Element {
  return (
    <ApolloProvider client={client}>
      <div className="App">
        <h1>Portara</h1>
        <Test />
      </div>
    </ApolloProvider>
  );
}

export default App;
