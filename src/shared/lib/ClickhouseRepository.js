const ClickhouseConnection = require("./ClickhouseConnection");

class ClickhouseRepository {
  constructor() {
    this.connection = new ClickhouseConnection().getConnection();
  }

  async insertData(query, data) {
    try {
      const result = await this.connection.insert(query, data).toPromise();
      console.log('Clickhouse Insert executed successfully 💿', result);
      return result;
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }
}

module.exports = ClickhouseRepository;
