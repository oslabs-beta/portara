# Portara

## Overview
Portara is an open source rate limiter designed for easy use with Apollo Server, including other Apollo implementations (inlcuidng `Apollo-Server-Express`, `Apollo-Server-Hapi`, `Apollo-Server-Koa`, and `Apollo-Server-Lambda`). By using GraphQL Directives, developers have the ability to easily implement multiple rate limiters with as little as four lines of code.

## Requirements
- **Node.js** *version* 8.0.0+

- **Redis** *version* 2.6.12+

## Install
With npm:

`npm install --save portara`


## Getting Started

####
- [ ] **First**, require PortaraSchemaDirective into your file that contains your Type Definitions *(or TypeDefs)* at the top of your file:

```javascript
const PortaraSchemaDirective = require('portara');
```
#### 

- [ ] **Second**, insert this schemaDirective is in your ApolloServer *(pay special attention to the schemaDirectives line)*:

```graphql
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req, res }) = ({ req, res }),
  schemaDirectives: { portara: portaraSchemaDirective },
});
```
#### 

- [ ] **Third**, add the directive @portara on your Field Definition and Objects within your GraphQL Type Definitions: 

```graphql
const typeDefs = gql`
  directive @portara(limit: Int!, per: String!) on FIELD_DEFINITION | OBJECT
  
  type Query { etc...
```
####
- [ ] **Fourth**, apply the Portara rate limiter anywhere you please. You can type out exactly how you want the rate limiter to work in plain English. Please note that the usage of "per" must pass a string in DOUBLE QUOTES. Below are a few examples:

- **On Object Type**

  - This implementation applies the Portara rate limiter on the entire Query Object (which includes the "hello" and     "goodbye" field definitions). 

  - The rate limiter limits 10 requests to the endpoint (per IP address) per every 5 seconds.

```graphql
type Query @portara( limit: 10, per: "5 seconds" ) {
  hello: String!
  goodbye: String!
}
```

- **On Field Type**

  - This implementation applies the Portara rate limiter on just the Field Defintion (just the "hello").
  
  - The rate limiter limits 300 requests to the endpoint (per IP address) per every 12 minutes.
  
```graphql
type Query {
  hello: String! @portara( limit: 300, per: "12 minutes" ) 
  goodbye: String!
}
```

- **On Both**

  - This implementation applies the Portara rate limiter on both the Object Type (the "hello" and "goodbye" field definitions).
  
  - The Field Definition (applied to the "hello" field definition) will **OVERRIDE** the Object Type rate limiter.
  
  - The Object Type rate limiter limits 10 requests to the endpoint (per IP address) per every 5 seconds.
  
  - The Field Definition rate limiter limits 15 requests every 5 seconds. Note that this will disregard the Query rate limiter and only follow the specifications of the "hello" rate limiter.
  
```graphql
type Query @portara( limit: 10, per: "5 seconds" ) {
  hello: String! @portara( limit: 15, per: "5 seconds" )
  goodbye: String!
}
```

- **Other Time Measurements**

  - The time measurements supported are:
    - **Milliseconds:**  *(can be typed as: millisecond, milliseconds, mil, or mils)*
    - **Seconds:**   *(can be typed as: second, seconds, sec, or secs)*
    - **Minutes:**   *(can be typed as: minute, minutes, min, or mins)*
    - **Hours:**   *(can be typed as: hour, hours, or h)*
    - **Days:**  *(can be typed as: day, days, or d)*
    - **Weeks:**   *(can be typed as: week, weeks,or w)*

 ```graphql
type Query @portara( limit: 12, per: "5 h" ) {
  hello: String! @portara( limit: 20, "per: 94 mils" )
  goodbye: String! @portara( limit: 90, "per: 2 minutes" )
  thankyou: String!
}
 ```

- **Default Setting**

  - The time measurement defaults to seconds (this limits 40 requests per second):

 ```graphql
type Query {
  hello: String! @portara( limit: 40 )
  goodbye: String!
}
 ```
 
- [ ] **Connect with the Portara Team!**

@Portara 

portara35@gmail.com

Steve Frend: https://github.com/stevefrend

Todd Alexander: https://github.com/toddalex

Cary L Chan: https://github.com/caryLchan

Alexander Infante: https://github.com/Alexander-Infante
