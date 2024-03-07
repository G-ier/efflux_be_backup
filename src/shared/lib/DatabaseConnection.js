const knex = require('knex');
const knexConfig = require('../../../knexfile');
const EnvironmentVariablesManager = require('../services/EnvironmentVariablesManager');

const databaseEnvironment =
  EnvironmentVariablesManager.getEnvVariable('DATABASE_ENVIRONMENT') || 'development';

class DatabaseConnection {
  static readOnlyInstance;
  static readWriteInstance;

  // constructor() {
  //   // this.connection = knex(config);
  //   this.connection = knex(config);
  //   console.debug('Database connection created: ', config);
  // }

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

  // constructor(isReadOnly = false) {
  //   if (!DatabaseConnection.instance) {
  //     let config = knexConfig[databaseEnvironment];

  //     if (databaseEnvironment === 'production') {
  //       if (isReadOnly === true) {
  //         config.connection = EnvironmentVariablesManager.getEnvVariable('DATABASE_URL_BE_RO');
  //       }
  //     }

  //     this.connection = knex(config);

  //     console.debug('Database connection created: ');
  //     console.debug(config);

  //     DatabaseConnection.instance = this;
  //   }

  //   return DatabaseConnection.instance;
  // }

  getConnection() {
    return this.connection;
  }

  // closeConnection() {
  //   return this.connection.destroy();
  // }
}

module.exports = DatabaseConnection;
