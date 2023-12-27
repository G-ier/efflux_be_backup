const redis = require('redis');

const redisUrl =
  process.env.DATABASE_ENVIRONMENT === 'production'
    ? process.env.REDIS_CLUSTER_URL
    : process.env.REDIS_CLUSTER_URL_STAGING;

const client = redis.createClient({
  url: redisUrl,
});

client.connect();

client.on('connect', () => {
  console.log('Redis client connected');
});

client.on('error', (err) => {
  console.log(`Redis went wrong ${err}`);
});

module.exports = {
  getAsync: client.get.bind(client),
  setAsync: client.set.bind(client),
};
