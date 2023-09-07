const knex = require("knex");
const knexConfig = require("../../../knexfile");

class DatabaseConnection {

  constructor(config = knexConfig.production) {
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
