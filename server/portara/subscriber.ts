import { GraphQLClient } from 'kikstart-graphql-client';
import { gql } from 'apollo-server-express';

interface IUserSetting {
  limit: any
  per: any
  throttle: any
}

export let userSettings: IUserSetting = {
  limit: 2,
  per: "10",
  throttle: "0",
}
//localhost for wsUrl needs to be only ws:// not wss:// <--= this one is for deployed websites
const Subclient = new GraphQLClient({
  // url: 'http://portara-web.herokuapp.com/graphql',
  // wsUrl: 'wss://portara-web.herokuapp.com/graphql',
  url: 'http://localhost:4000/graphql',
  wsUrl: 'ws://localhost:4000/graphql',
});
// const myID = 'asdfasf'

const subscr = gql`
  subscription {
    portaraSettings(userID: "hello") {
      userID
      limit
      per
      throttle
    }
}
`
// const subscr = gql`
//   subscription portaraSettings($userID: userID!) {
//     portaraSettings(userID: $userID) {
//       userID
//       limit
//       per
//       throttle
//     }
//   }
// `

/*
  - Currently set up to send a userID when subscribing. This works and the ID is logged on website server.
  - Next step: 
*/


Subclient.runSubscription(subscr).subscribe({
  next: (res) => {
    console.log('LINE 51', res)
    userSettings = res.data.portaraSettings;
    // console.log(userSettings)
  },
  error: (error) => console.error('error', error),
  complete: () => console.log('done'),
});