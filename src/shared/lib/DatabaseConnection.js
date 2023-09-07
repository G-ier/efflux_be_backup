const knex = require("knex");
const knexConfig = require("../../../knexfile");
const databaseEnvironment = process.env.DATABASE_ENVIRONMENT || "development";
class DatabaseConnection {

  constructor(config = knexConfig[databaseEnvironment]) {
    if (!DatabaseConnection.instance) {
      this.connection = knex(config);
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
