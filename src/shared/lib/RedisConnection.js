// Third party imports
require("dotenv").config();
const redis = require('redis');
// Local imports
const EnvironmentVariablesManager = require('../services/EnvironmentVariablesManager');

class RedisConnection {
  constructor() {
    if (!RedisConnection.instance) {
      this.client = null; // Initialize client property
      RedisConnection.instance = this;
    }
    return RedisConnection.instance;
  }

   async initialize() {
    if(EnvironmentVariablesManager.getEnvVariable("ENABLE_CACHE") !== 'true') {
      return null
    }
    const instance = new RedisConnection();
    const client = await instance.createClient();
    this.client=client
    instance.client= client
    instance.setupEventListeners();
    Object.freeze(instance); // Freeze the instance after setup
    return instance;
  }

  async createClient() {
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

    await client.connect();
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

  async getAsync(key) {
    if(!EnvironmentVariablesManager.getEnvVariable("ENABLE_CACHE") === 'true'){
      return null
    }
    try {
      const reply = await this.client.get(key);
      return reply;
    } catch (err) {
      throw err;
    }
  }



  async setAsync(key, value) {
    if(!EnvironmentVariablesManager.getEnvVariable("ENABLE_CACHE") === 'true'){
      return () =>{}
    }
    try {
      const reply = await this.client.set(key, value);
      return reply;
    } catch (err) {
      throw err;
    }
  }


  async delAsync(key) {
    if(!EnvironmentVariablesManager.getEnvVariable("ENABLE_CACHE") === 'true'){
      return
    }
    try {
      const reply = await this.client.del(key);
      return reply;
    } catch (err) {
      console.error(`Error in delAsync with key ${key}:`, err);
      throw err;
    }
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

const instance = new RedisConnection();

async function initRedis() {
  try {
    const init = await instance.initialize();
    if (init) console.log("Redis Client Initialized");
    else  console.log("Redis Client Not Initialized");
  } catch (error) {
    console.error("Failed to initialize Redis Client:", error);
    throw error;
  }
}

module.exports = instance;
module.exports.initRedis = initRedis;
