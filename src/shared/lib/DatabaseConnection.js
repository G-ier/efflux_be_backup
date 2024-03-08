const knex = require('knex');
const knexConfig = require('../../../knexfile');
const EnvironmentVariablesManager = require('../services/EnvironmentVariablesManager');

const databaseEnvironment =
  EnvironmentVariablesManager.getEnvVariable('DATABASE_ENVIRONMENT') || 'development';

class DatabaseConnection {
  static readOnlyInstance;
  static readWriteInstance;

  static getReadOnlyConnection() {
    if (!DatabaseConnection.readOnlyInstance) {
      let config;
      if (databaseEnvironment === 'production') {
        config = knexConfig[`${databaseEnvironment}_read_only`];
      } else {
        config = knexConfig[databaseEnvironment];
      }
      DatabaseConnection.readOnlyInstance = knex(config);
      console.debug('Read-only database connection created: ', config);
    }

    return DatabaseConnection.readOnlyInstance;
  }

  static getReadWriteConnection() {
    if (!DatabaseConnection.readWriteInstance) {
      let config = knexConfig[databaseEnvironment];

      DatabaseConnection.readWriteInstance = knex(config);
      console.debug('Read-write database connection created: ', config);
    }

    return DatabaseConnection.readWriteInstance;
  }

  static closeConnection(isReadOnly = true) {
    if (isReadOnly && DatabaseConnection.readOnlyInstance) {
      DatabaseConnection.readOnlyInstance.destroy();
      DatabaseConnection.readOnlyInstance = null;
      console.debug('Read-only database connection closed.');
    } else if (!isReadOnly && DatabaseConnection.readWriteInstance) {
      DatabaseConnection.readWriteInstance.destroy();
      DatabaseConnection.readWriteInstance = null;
      console.debug('Read-write database connection closed.');
    }
  }

  static getConnection(isReadOnly = true) {
    return isReadOnly
      ? DatabaseConnection.getReadOnlyConnection()
      : DatabaseConnection.getReadWriteConnection();
  }
}

module.exports = DatabaseConnection;
