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
      let config = { ...knexConfig[databaseEnvironment] };

      if (databaseEnvironment === 'production') {
        config.connection = EnvironmentVariablesManager.getEnvVariable('DATABASE_URL_BE_RO');
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

  static closeConnection(connection) {
    if (connection) {
      connection.destroy();
    }
  }

  getConnection() {
    return this.connection;
  }
}

module.exports = DatabaseConnection;
