import React from 'react';
import ApolloClient from 'apollo-boost';
import { ApolloProvider } from '@apollo/react-hooks';
import Test from './Test';

function App(): JSX.Element {
  return (

      <div className="App">
        <Test />
      </div>

  );
}

export default App;
