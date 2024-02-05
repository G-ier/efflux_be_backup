const ClickhouseConnection = require("./ClickhouseConnection");

class ClickhouseRepository {
  constructor() {
    this.connection = new ClickhouseConnection().getConnection();
  }

  async upsertClickHouse(tableName, data, conflictTarget = null, excludeFields = [], trx = null) {
    try {
      const columns = Object.keys(data[0]);
      const values = data.map(row => `(${columns.map(col => trx ? trx.raw('?', [row[col]]) : `'${row[col]}'`).join(', ')})`).join(', ');

      // If conflictTarget is not provided, simply execute the insert query
      if (!conflictTarget) {
        const insertQuery = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${values}`;
        if (trx) {
          await trx.insert(insertQuery, data);
        } else {
          this.connection.insert(insertQuery, data);
        }
        return;
      }

      const updateColumns = columns.filter(key => !excludeFields.includes(key)).map(key => `${key} = ${tableName}.${key}`);

      if (updateColumns.length === 0) {
        throw new Error("No fields left to update after excluding.");
      }

      const updateValues = updateColumns.join(', ');

      const query = `
        INSERT INTO ${tableName} (${columns.join(', ')})
        VALUES ${values}
        ON DUPLICATE KEY UPDATE
        ${updateValues}
      `;

      if (trx) {
        await trx.insert(query, data);
      } else {
        this.connection.insert(query, data);
      }
    } catch (error) {
      console.error("❌ Error upserting row/s on Clickhouse: ", error);
      throw error;
    }
  }

  async insertData(query, data) {
    try {
      const result = await this.connection.insert(query, data).toPromise();
      console.log('Clickhouse Inserted successfully', result);
      return result;
    } catch (error) {
      console.error('Error executing insert query:', error);
      throw error;
    }
  }

  async queryData(query, data) {
    try {
      const result = await this.connection.query(query, data).toPromise();
      console.log('Clickhouse queried successfully', result);
      return result;
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }
}

module.exports = ClickhouseRepository;
