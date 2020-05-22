import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { ApolloProvider } from '@apollo/react-hooks';
import ApolloClient from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory'
import Test from './Test';
import { SubscriptionClient} from 'subscriptions-transport-ws';
import { WebSocketLink } from 'apollo-link-ws';
import { split } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { getMainDefinition } from 'apollo-utilities';


const cache = new InMemoryCache();
// querys and mutations go over normal HHTP
const httpLink = new HttpLink({
  uri: 'http://portara-web.herokuapp.com/graphql'
});
const wsClient = new SubscriptionClient(`wss://portara-web.herokuapp.com/graphql`, {
  reconnect: true
})
const wsLink = new WebSocketLink(wsClient)

const link = split(
  // split based on operation type
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
);

const client = new ApolloClient({cache, link})



ReactDOM.render(
  <ApolloProvider client={client}>
    <App/>
  </ApolloProvider>,
  document.getElementById('root')
);


