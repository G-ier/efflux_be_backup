const redis = require('redis');

let redisUrl = '';

if (process.env.REDIS_ENVIRONMENT === 'production') {
  redisUrl = process.env.REDIS_CLUSTER_URL_PRODUCTION;
} else if (process.env.REDIS_ENVIRONMENT === 'staging') {
  redisUrl = process.env.REDIS_CLUSTER_URL_STAGING;
} else {
  redisUrl = process.env.REDIS_CLUSTER_URL_LOCAL;
}

const client = redis.createClient({
  url: redisUrl,
});

client.connect();

client.on('connect', () => {
  console.log('Redis client connected');
});

client.on('error', (err) => {
  console.log(`Redis went wrong ${err}`);
  console.log('Environment: ', process.env.DATABASE_ENVIRONMENT);
});

module.exports = {
  getAsync: client.get.bind(client),
  setAsync: client.set.bind(client),
};
