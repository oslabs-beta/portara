import { GraphQLClient } from 'kikstart-graphql-client';
import { gql } from 'apollo-server-express';
import { userID } from '../server'
import { IUserSettings } from './interfaces';

export let userSettings: IUserSettings = {};
//localhost for wsUrl needs to be only ws:// not wss:// <--= this one is for deployed websites
const Subclient = new GraphQLClient({
  // url: 'http://portara-web.herokuapp.com/graphql',
  // wsUrl: 'wss://portara-web.herokuapp.com/graphql',
  url: 'http://localhost:4000/graphql',
  wsUrl: 'ws://localhost:4000/graphql',
});


const subscr = gql`
  subscription($userID: String!) {
    portaraSettings(userID: $userID) {
      userID
      limit
      per
      throttle
    }
}
`

/*
  - Currently set up to send a userID when subscribing. This works and the ID is logged on website server.
  - Next step: maybe have a default user token like "default", and then from the website we send back the token always, BUT if the token is !== 'default', the functionality on the tool will change
*/

Subclient.runSubscription(subscr, { userID }).subscribe({
  next: (res) => {
    console.log('LINE 51', res)
    userSettings = res.data.portaraSettings;
  },
  error: (error) => console.error('error', error),
  complete: () => console.log('done'),
});