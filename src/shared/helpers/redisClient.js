const redis = require('redis');

const client = redis.createClient({
  url: process.env.REDIS_CLUSTER_URL_LOCAL,
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
