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
    }

    return DatabaseConnection.readOnlyInstance;
  }

  static getReadWriteConnection() {
    if (!DatabaseConnection.readWriteInstance) {
      let config = knexConfig[databaseEnvironment];

      DatabaseConnection.readWriteInstance = knex(config);
    }

    return DatabaseConnection.readWriteInstance;
  }

  static closeConnection(isReadOnly = true) {
    if (isReadOnly && DatabaseConnection.readOnlyInstance) {
      DatabaseConnection.readOnlyInstance.destroy();
      DatabaseConnection.readOnlyInstance = null;
    } else if (!isReadOnly && DatabaseConnection.readWriteInstance) {
      DatabaseConnection.readWriteInstance.destroy();
      DatabaseConnection.readWriteInstance = null;
    }
  }

  static getConnection(isReadOnly = true) {
    return isReadOnly
      ? DatabaseConnection.getReadOnlyConnection()
      : DatabaseConnection.getReadWriteConnection();
  }
}

module.exports = DatabaseConnection;
