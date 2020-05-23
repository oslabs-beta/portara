import { GraphQLClient } from 'kikstart-graphql-client';
import { gql } from 'apollo-server-express';

interface IUserSetting {
  limit: any
  per: number
  throttle: number
}

export let userSettings: IUserSetting = {
  limit: 2,
  per: 10,
  throttle: 0,
}

const Subclient = new GraphQLClient({
  url: 'http://portara-web.herokuapp.com/graphql',
  wsUrl: 'wss://portara-web.herokuapp.com/graphql',
});

const subscr = gql`
  subscription {
    portaraSettings {
      limit
      per
      throttle
    }
  }
`



Subclient.runSubscription(subscr).subscribe({
  next: (res) => {
    console.log(res)
    userSettings = res.data.portaraSettings;
    // console.log(userSettings)
  },
  error: (error) => console.error('error', error),
  complete: () => console.log('done'),
});