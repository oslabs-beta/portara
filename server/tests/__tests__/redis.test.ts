const asyncRedis = require('async-redis');
const client = asyncRedis.createClient();

// Rate Limiter Redis Mock Testing -------------------------------------
/*
Using Asynchronous Redis to properly test functionality and ensure the
rate limiting algorithm works
Great testing in case Redis disconnects
*/


describe('Redis connection and functionality are performing', () => {

  beforeAll(async () => {
    if (client.status === "end") {
      await client.connect()
    }
  });

  afterAll(async () => {
    await client.disconnect()
  });

  const IP = "123.4.5.67";

  it('Checks to see if the key exists in Redis', async () => {
    const key = IP + "_" + "Exists";
    await client.psetex(key, 10, 1);
    const redisGetValue = await client.exists(key);
    expect(redisGetValue).toBe(1); // Redis replies "1" if true

    const redisNotExistentKey = await client.exists("Nonexistent_Key");
    expect(redisNotExistentKey).toBe(0); // Redis replies "0" if false
  });

  it('If key does not exists, sets the key value pair in Redis', async () => {
    const key = IP + "_" + "Nonexistent"
    const redisNotExistentKey = await client.exists("Nonexistent_Key");
    expect(redisNotExistentKey).toBe(0);
    if (redisNotExistentKey === 0) {
      await client.psetex(key, 10, 1)
    };
    const value = await client.get(key);
    await expect(value).toBe("1");
  });

  it('Expires the key', async () => {
    const key = IP + "_" + "Expires";
    // Set key: value with expiration
    await client.psetex(key, 100, 1);
    const existingKey = await client.exists(key)
    await expect(existingKey).toBe(1);

    function delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    await delay(500);
    const expiredKey = await client.exists(key);
    await expect(expiredKey).toBe(0);
  });

  it('If the key does exist, increments the value', async () => {
    const key = IP + "_" + "Increment";
    await client.psetex(key, 20, 1);
    await client.incr(key);
    const incrValue = await client.get(key);
    await expect(incrValue).toBe("2");
  });
});