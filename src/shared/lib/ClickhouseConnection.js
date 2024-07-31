const EnvironmentVariablesManager = require("../services/EnvironmentVariablesManager");
const { ClickHouse } = require("clickhouse");

const defaultConfig = {
  url: EnvironmentVariablesManager.getEnvVariable('CLICKHOUSE_URL'),
  format: 'json',
  debug: true,
  basicAuth: {
    username: EnvironmentVariablesManager.getEnvVariable('CLICKHOUSE_USER'),
    password: EnvironmentVariablesManager.getEnvVariable('CLICKHOUSE_PASSWORD'),
    config: {
      enable_http_compression: true,
      database: EnvironmentVariablesManager.getEnvVariable('CLICKHOUSE_DB'),
    },
  }
}

class ClickhouseConnection {
  constructor() {
    if (!ClickhouseConnection.instance) {
      this.connection = new ClickHouse(defaultConfig);
      ClickhouseConnection.instance = this;
    }
    return ClickhouseConnection.instance;
  }

  getConnection() {
    return this.connection;
  }

  closeConnection() {
    return this.connection.destroy();
  }
}

module.exports = ClickhouseConnection;
