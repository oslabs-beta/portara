# Portara

## Overview
Portara is an open source rate limiter designed for easy use with Apollo Server, including other Apollo implementations (including `Apollo-Server-Express`, `Apollo-Server-Hapi`, `Apollo-Server-Koa`, and `Apollo-Server-Lambda`). By using GraphQL Directives, developers have the ability to easily implement multiple rate limiters with as little as four lines of code.

## Requirements
- **Node.js** *version* 8.0.0+

- **Redis** *version* 2.6.12+

## Install
With npm:

```
npm install --save portara
```

**Note:** Redis is a requirement for this package. You can visit [Redis' Getting Started Page](https://redislabs.com/get-started-with-redis/) for information on getting started with Redis. If you are using multiple servers (or the serverless framework), we recommend using Redis Cloud.
 

## Getting Started

####
- [ ] **1**. Import Portara into your server file:

```javascript
import Portara from 'portara';
```
#### 

- [ ] **2**. Add to your Apollo Server *(make sure BOTH the context and schemaDirectives are added*:

```graphql
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req, res }) = ({ req, res }),
  schemaDirectives: { portara: portara('TOKEN GOES BETWEEN THESE QUOTES') },
});
```
The token is optional. You can get a token from Portara.io with a quick sign up throught Github Oauth. The token grants access to modify your rate limiter / throttler without redeploying your app.  If you do not plan on using this feature, leave the parameter empty.
#### 

- [ ] **3**. Add the directive @portara to your type definitions (copy line below): 

```graphql
const typeDefs = gql`
  directive @portara(limit: Int!, per: ID!, throttle: ID!) on FIELD_DEFINITION | OBJECT
  
  type Query { etc...
```
####
- [ ] **4**. You can type out exactly how you want the rate limiter to work in plain English. Please note that the usage of any strings must be in DOUBLE QUOTES, and values default to seconds. Below are a few examples:

- **On Object Type**

  - This implementation applies the Portara rate limiter on the entire Query Object (which includes the "hello" and "goodbye" field definitions). 

  - The rate limiter limits 10 requests to the endpoint (per IP address) per every 5 seconds.

```graphql
type Query @portara(limit: 10, per: "5 seconds", throttle: "0") {
  hello: String!
  goodbye: String!
}
```
- **Throttling**
  - Throttling is an option.  If throttling is turned on with any truthy values such as (throttle: "500ms"), it will no longer block requests.  However, it will allow requests to come in at the time frame passed in.  In this case, every 500 miliseconds.

- **On Field Type**

  - This implementation applies the Portara rate limiter on just the Field Defintion (just the "hello").
  
  - The rate limiter limits 300 requests to the endpoint (per IP address) per every 12 minutes.
  
```graphql
type Query {
  hello: String! @portara(limit: 300, per: "12 minutes", throttle: 0) 
  goodbye: String!
}
```

- **On Both**

  - If portara is applied to both object and field levels, the field will override any object level that's being applied to it. For the example below, "hello" would have a limit of 15, and "bye" would have a limit of 10.
  
```graphql
type Query @portara(limit: 10, per: "5 seconds", throttle: 0) {
  hello: String! @portara( limit: 15, per: "5 seconds", throttle: 0 )
  goodbye: String!
}
```

- **Other Time Measurements**

  - The time measurements supported are:
    - **Milliseconds:**  *(can be typed as: ms, millisecond, milliseconds, mil, mils)*
    - **Seconds:**   *(can be typed as: second, seconds, sec, or secs)*
    - **Minutes:**   *(can be typed as: minute, minutes, min, or mins)*
    - **Hours:**   *(can be typed as: hour, hours, or h)*
    - **Days:**  *(can be typed as: day, days, or d)*
    - **Weeks:**   *(can be typed as: week, weeks,or w)*

 ```graphql
type Query @portara(limit: 12, per: "5 h", throttle: 0) {
  hello: String! @portara(limit: 20, per: "94 ms", throttle: 0)
  goodbye: String! @portara(limit: 90, per: "2 minutes", throttle: 0)
  thankyou: String!
}
 ```
 
- [ ] **Lastly, Connect with the Portara Team!**

@Portara 

portara35@gmail.com

Steve Frend: [Steve's Github](https://github.com/stevefrend) and [Steve's LinkedIn](https://www.linkedin.com/in/steve-christersson-frend-697a8588/)

Todd Alexander: [Todd's Github](https://github.com/toddalex) and [Todd's LinkedIn](http://www.linkedin.com/in/toddmalexander)

Cary L Chan: [Cary's Github](https://github.com/caryLchan) and [Cary's LinkedIn](https://www.linkedin.com/in/cary-chan-2b7933b/)

Alexander Infante: [Alex's Github](https://github.com/Alexander-Infante) and [Alex's LinkedIn](https://www.linkedin.com/in/alexanderinfante/)
