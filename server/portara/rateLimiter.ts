const asyncRedis = require('async-redis');
const client = asyncRedis.createClient();
import timeFrameMultiplier from './timeFrameMultiplier'

// Redis Rate Limiter -------------------------------------------
const rateLimiter = async (limit: number, per: string, ip: string, scope: string) => {

  // Per Functionality ---------------------------
  const perNum = parseFloat(<any>per.match(/\d+/g)?.toString())
  const perWord = per.match(/[a-zA-Z]+/g)?.toString().toLowerCase();

  // get final result of expirationTimeVariable
  let expirationTimeVariable = (<number>timeFrameMultiplier(perWord) * perNum);

  // ---------------------------------------------
  const key = ip + '_' + scope;
  let exists = await client.exists(key);

  if (exists === 0) {
    await client.psetex(key, expirationTimeVariable, 1);
    return true;
  } else {
    await client.incr(key);
    let value = await client.get(key);
    value = Number(value);
    return value > limit ? false : true;
  }
};

export default rateLimiter;