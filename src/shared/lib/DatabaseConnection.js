const knex = require('knex');
const knexConfig = require('../../../knexfile');
const EnvironmentVariablesManager = require('../services/EnvironmentVariablesManager');
const databaseEnvironment =
  EnvironmentVariablesManager.getEnvVariable('DATABASE_ENVIRONMENT') || 'development';
class DatabaseConnection {
  constructor(isReadOnly = false) {
    if (!DatabaseConnection.instance) {
      let config = knexConfig[databaseEnvironment];

      if (databaseEnvironment === 'production') {
        if (isReadOnly) {
          config.connection = EnvironmentVariablesManager.getEnvVariable('DATABASE_URL_BE_RO');
        }
      }

      this.connection = knex(config);

      console.debug('Database connection created: ');
      console.debug(config);

      DatabaseConnection.instance = this;
    }

    return DatabaseConnection.instance;
  }

  getConnection() {
    return this.connection;
  }

  closeConnection() {
    return this.connection.destroy();
  }
}

module.exports = DatabaseConnection;
