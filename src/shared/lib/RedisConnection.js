// Third party imports
const redis = require('redis');

// Local imports
const EnvironmentVariablesManager = require('../services/EnvironmentVariablesManager');

class RedisConnection {
  constructor() {
    if (!RedisConnection.instance) {
      this.client = this.createClient();
      this.setupEventListeners();
      RedisConnection.instance = this;
    }

    return RedisConnection.instance;
  }

  createClient() {
    const REDIS_ENVIRONMENT = EnvironmentVariablesManager.getEnvVariable('REDIS_ENVIRONMENT');
    let redisUrl = '';

    if (REDIS_ENVIRONMENT === 'production') {
      redisUrl = EnvironmentVariablesManager.getEnvVariable('REDIS_CLUSTER_URL_PRODUCTION');
    } else if (REDIS_ENVIRONMENT === 'staging') {
      redisUrl = EnvironmentVariablesManager.getEnvVariable('REDIS_CLUSTER_URL_STAGING');
    } else {
      redisUrl = EnvironmentVariablesManager.getEnvVariable('REDIS_CLUSTER_URL_LOCAL');
    }

    const client = redis.createClient({
      url: redisUrl,
    });

    client.connect();
    return client;
  }

  setupEventListeners() {
    this.client.on('connect', () => {
      console.log('Class Redis client connected');
    });

    this.client.on('error', (err) => {
      console.log(`Class Redis went wrong ${err}`);
      console.log('Environment: ', EnvironmentVariablesManager.getEnvVariable('REDIS_ENVIRONMENT'));
    });
  }

  getClient() {
    return this.client;
  }

  closeConnection() {
    return this.client.quit();
  }

  // Define async get and set methods to utilize Redis commands
  async getAsync(key) {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, reply) => {
        if (err) reject(err);
        resolve(reply);
      });
    });
  }

  async setAsync(key, value) {
    return new Promise((resolve, reject) => {
      this.client.set(key, value, (err, reply) => {
        if (err) reject(err);
        resolve(reply);
      });
    });
  }

  async delAsync(key) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err, reply) => {
        if (err) reject(err);
        resolve(reply);
      });
    });
  }

  async deleteKeysByTableName(tableName) {
    const pattern = `*${tableName}*`;
    let cursor = '0';

    do {
      const reply = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = reply[0];
      const keys = reply[1];

      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`Deleted ${keys.length} keys for table: ${tableName}`);
      }
    } while (cursor !== '0');

    console.log(`Completed deleting keys for table: ${tableName}`);
  }
}

// Export as a singleton
const instance = new RedisConnection();
Object.freeze(instance);

module.exports = instance;
