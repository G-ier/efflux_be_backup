const redis = require('redis');
const { promisify } = require('util');

const { REDIS_HOST, REDIS_PASSWORD } = process.env;

const connectOptions = {
  host: REDIS_HOST || '127.0.0.1',
  password: REDIS_PASSWORD || undefined,
}

const client = redis.createClient(connectOptions);

const clientReady = new Promise((resolve, reject) => {
  client.on('ready', () => {
    console.info('Redis connection established');
    resolve();
  });

  client.on('error', (err) => {
    console.warn('Redis connection error', err);
    if (err.code === 'ECONNREFUSED') {
      client.quit();
      reject(err);
    }
  });
});

async function get(key) {
  await clientReady.catch(() => null);
  if (!client.connected) return null;
  return promisify(client.get.bind(client))(key);
}

async function set(key, value, options = {}) {
  await clientReady.catch(() => null);
  if (!client.connected) return null;
  await promisify(client.set.bind(client))(key, value);
  if (options.EX) {
    await promisify(client.expire.bind(client))(key, options.EX);
  }
}

async function del(key) {
  await clientReady.catch(() => null);
  if (!client.connected) return null;
  return promisify(client.del.bind(client))(key);
}

module.exports = {
  get, set, del
}
