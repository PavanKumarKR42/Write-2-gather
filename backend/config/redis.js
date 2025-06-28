const fetch = require('node-fetch');

const baseUrl = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redisClient = {
  setEx: async (key, ttl, value) => {
    const url = `${baseUrl}/set/${key}/${value}?EX=${ttl}`;
    await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  get: async (key) => {
    const url = `${baseUrl}/get/${key}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    return data.result || null;
  },
};

module.exports = redisClient;
