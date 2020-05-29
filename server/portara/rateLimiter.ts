const asyncRedis = require('async-redis');
const client = asyncRedis.createClient();
import timeFrameMultiplier from './timeFrameMultiplier'

// Redis Rate Limiter -------------------------------------------
const rateLimiter = async (limit: number, per: string, ip: string, scope: string) => {

  // Per Functionality ---------------------------
  /* Separating string of the time limit into a number and a measure of time
  ex. (per: "10 minutes") into (10, "minutes")
  */
  const perNum = parseFloat(<string>per.match(/\d+/g)?.toString())
  const perWord = <string>per.match(/[a-zA-Z]+/g)?.toString().toLowerCase();

  // get final result of expirationTimeVariable
  let expirationTimeVariable = (<number>timeFrameMultiplier(perWord) * perNum);

  // ---------------------------------------------

  /* Integrating Redis
  Setting key value pairs in redis that expire after a set amount of time
  key: [user IP address]_[directive @portara is placed on]
  value: incrementing the number of times the user is registered in Redis
  expiration: time passed in from timeFrameMultiplier algorithm
  */

  const key = ip + '_' + scope;
  let exists = await client.exists(key);

  if (exists === 0) {
    await client.psetex(key, expirationTimeVariable, 1);
    return true;
  } else {
    await client.incr(key);
    let value = await client.get(key);
    return +value > limit ? false : true;
  }
};

export default rateLimiter;