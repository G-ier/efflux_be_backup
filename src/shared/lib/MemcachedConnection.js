// Third party imports
require('dotenv').config();
const memjs = require('memjs');
// Local imports
const EnvironmentVariablesManager = require('../services/EnvironmentVariablesManager');

class MemcachedConnection {
  constructor() {
    if (!MemcachedConnection.instance) {
      this.client = null; // Initialize client property
      MemcachedConnection.instance = this;
    }
    return MemcachedConnection.instance;
  }

  async initialize() {
    if (EnvironmentVariablesManager.getEnvVariable('ENABLE_CACHE') !== 'true') {
      return null;
    }
    const instance = new MemcachedConnection();
    const client = await instance.createClient();
    this.client = client;
    instance.client = client;
    Object.freeze(instance); // Freeze the instance after setup
    return instance;
  }

  async createClient() {
    const MEMCACHED_ENVIRONMENT =
      EnvironmentVariablesManager.getEnvVariable('MEMCACHED_ENVIRONMENT');
    let memcachedServers = '';

    if (MEMCACHED_ENVIRONMENT === 'production') {
      memcachedServers = EnvironmentVariablesManager.getEnvVariable('MEMCACHED_SERVERS_PRODUCTION');
    } else if (MEMCACHED_ENVIRONMENT === 'staging') {
      memcachedServers = EnvironmentVariablesManager.getEnvVariable('MEMCACHED_SERVERS_STAGING');
    } else {
      memcachedServers = EnvironmentVariablesManager.getEnvVariable('MEMCACHED_SERVERS_LOCAL');
    }
    const client = memjs.Client.create(memcachedServers);

    return client;
  }

  getClient() {
    return this.client;
  }

  closeConnection() {
    return this.client.close();
  }

  async getAsync(key) {
    if (EnvironmentVariablesManager.getEnvVariable('ENABLE_CACHE') !== 'true') {
      return null;
    }
    try {
      const value = await this.client.get(key);
      return value ? value.value.toString() : null;
    } catch (err) {
      throw err;
    }
  }

  async setAsync(key, value, expires = 0) {
    if (EnvironmentVariablesManager.getEnvVariable('ENABLE_CACHE') !== 'true') {
      return;
    }
    try {
      const reply = await this.client.set(key, value, { expires });
      return reply;
    } catch (err) {
      throw err;
    }
  }

  async delAsync(key) {
    if (EnvironmentVariablesManager.getEnvVariable('ENABLE_CACHE') !== 'true') {
      return;
    }
    try {
      const reply = await this.client.delete(key);
      return reply;
    } catch (err) {
      console.error(`Error in delAsync with key ${key}:`, err);
      throw err;
    }
  }
}

const instance = new MemcachedConnection();

async function initMemcached() {
  try {
    const init = await instance.initialize();
    if (init) console.log('Memcached Client Initialized');
    else console.log('Memcached Client Not Initialized');
  } catch (error) {
    console.error('Failed to initialize Memcached Client:', error);
    throw error;
  }
}

module.exports = instance;
module.exports.initMemcached = initMemcached;
