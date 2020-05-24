import { GraphQLClient } from 'kikstart-graphql-client';
import { gql } from 'apollo-server-express';
import { userID } from '../server'
import { IUserSettings } from './interfaces';

export let userSettings: IUserSettings = {};
/*
- Wrap all subscriber functionality in a way that offline use won't trigger a sub. IE if the user doesn't enter a name, no sub gets triggered
*/
if (userID) {
  // Creates a set of URLs to be used for subscriptions
  //localhost for wsUrl needs to be only ws:// not wss:// <--= this one is for deployed websites
  const graphQLClient = new GraphQLClient({
    url: 'http://portara-web.herokuapp.com/graphql',
    wsUrl: 'wss://portara-web.herokuapp.com/graphql',
    // url: 'http://localhost:4000/graphql',
    // wsUrl: 'ws://localhost:4000/graphql',
  });

  // Query for subscription where userID is grabbed from server.ts (user enters manually)
  const subscr = gql`
    subscription($userID: String!) {
      portaraSettings(userID: $userID) {
        name
        limit
        per
        throttle
      }
  }
  `;
  //  Subscription gets triggered with userID as variable, and userSettings get updated with each response from website
  graphQLClient.runSubscription(subscr, { userID }).subscribe({
    next: (res) => {
      userSettings = res.data.portaraSettings
      console.log(userSettings)
    },
    error: (error) => console.error('error', error),
    complete: () => console.log('done'),
  });
}