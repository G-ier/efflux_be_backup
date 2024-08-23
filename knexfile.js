// Third party imports
require('dotenv').config();
const pg = require('pg');

// Local imports
const EnvironmentVariablesManager = require('./src/shared/services/EnvironmentVariablesManager');

if (EnvironmentVariablesManager.getEnvVariable('DATABASE_ENVIRONMENT') !== 'development') {
  pg.defaults.ssl = { rejectUnauthorized: false };
}

module.exports = {
  production: {
    client: 'pg',
    connection: EnvironmentVariablesManager.getEnvVariable('DATABASE_URL'),
    pool: {
      min: 0, // It is recommended to set min: 0 so all idle connections can be terminated.
      max: 7,
      acquireTimeoutMillis: 120000,
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
    useNullAsDefault: true,
    ssl: { rejectUnauthorized: false },
  },
  production_read_only: {
    client: 'pg',
    connection: EnvironmentVariablesManager.getEnvVariable('DATABASE_URL'),
    pool: {
      min: 0, // It is recommended to set min: 0 so all idle connections can be terminated.
      max: 7,
      acquireTimeoutMillis: 120000,
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
    useNullAsDefault: true,
    ssl: { rejectUnauthorized: false },
  },
  staging: {
    client: 'pg',
    connection: EnvironmentVariablesManager.getEnvVariable('DATABASE_URL_STAGING'),
    pool: {
      min: 0, // It is recommended to set min: 0 so all idle connections can be terminated.
      max: 4,
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
    useNullAsDefault: true,
    ssl: { rejectUnauthorized: false },
  },
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL_LOCAL,
    pool: {
      min: 0, // It is recommended to set min: 0 so all idle connections can be terminated.
      max: 7,
      acquireTimeoutMillis: 120000,
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
    useNullAsDefault: true,
    ssl: { rejectUnauthorized: false },
  },
  onUpdateTrigger: (table) => `
    CREATE TRIGGER updated_at
    BEFORE UPDATE ON ${table}
    FOR EACH ROW
    EXECUTE PROCEDURE updated_at_column();
  `,
};
