

const ClickhouseConnection = require('./ClickhouseConnection');
const { ClickhouseLogger } = require('./WinstonLogger');

class ClickhouseRepository {
  constructor() {
    this.connection = new ClickhouseConnection().getConnection();
  }

  async upsertClickHouse(tableName, data, conflictTarget = null, excludeFields = [], trx = null) {
    try {
      const columns = Object.keys(data[0]);
      const values = data
        .map(
          (row) =>
            `(${columns
              .map((col) => (trx ? trx.raw('?', [row[col]]) : `'${row[col]}'`))
              .join(', ')})`,
        )
        .join(', ');

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

      const updateColumns = columns
        .filter((key) => !excludeFields.includes(key))
        .map((key) => `${key} = ${tableName}.${key}`);

      if (updateColumns.length === 0) {
        throw new Error('Clickhouse: No fields left to update after excluding.');
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
      console.error('❌ Error upserting row/s on Clickhouse: ', error);
      ClickhouseLogger.error('❌ Error upserting row/s on Clickhouse: ', error);
      throw error;
    }
  }

  async insertData(query, data) {
    try {
      const result = await this.connection.insert(query, data).toPromise();
      console.info('✅ Clickhouse Inserted successfully', result);
      ClickhouseLogger.info('✅ Clickhouse Inserted successfully', result);
      return result;
    } catch (error) {
      console.error('❌ Error executing insert query:', error);
      ClickhouseLogger.error('❌ Error executing insert query:', error);
      throw error;
    }
  }

  async queryData(query, data) {
    try {
      const result = await this.connection.query(query, data).toPromise();
      console.info('✅ Clickhouse queried successfully', result);
      ClickhouseLogger.info('✅ Clickhouse queried successfully', result);

      return result;
    } catch (error) {
      console.error('❌ Error executing query:', error);
      ClickhouseLogger.error('❌ Error executing query:', error);
      throw error;
    }
  }

  // query insights
  async queryClickHouseInsights(network, ts, startDate, endDate) {
    try {
        // SQL query to execute
        const query = `SELECT * FROM efflux.insights WHERE network='${network}' AND traffic_source='${ts}' AND updatedAt >= '${startDate} 00:00:00' AND updatedAt <= '${endDate} 23:59:59';`;

        // Execute the query and fetch results
        const response = await this.connection.query(query).toPromise();

        console.log("---------------- RESPONSE ----------------------");
        console.log(response);
        console.log("---------------- RESPONSE ----------------------");

        return response;

    } catch (error) {
        // Handle any errors that occur
        console.error('Error querying ClickHouse:', error);
    }
  }

  // query campaigns
  async queryClickHouseCampaigns(campaign_id) {
    try {
        // SQL query to execute
        const query = `SELECT * FROM efflux.campaign_timeseries WHERE campaign_id='${campaign_id}';`;

        // Execute the query and fetch results
        const response = await this.connection.query(query).toPromise();

        console.log("---------------- RESPONSE ----------------------");
        console.log(response);
        console.log("---------------- RESPONSE ----------------------");

        return response;

    } catch (error) {
        // Handle any errors that occur
        console.error('Error querying ClickHouse:', error);
    }
  }

  // query adsets
  async queryClickHouseAdsets(adset_id) {
    try {
        // SQL query to execute
        const query = `SELECT * FROM efflux.adset_timeseries WHERE adset_id='${adset_id}';`;

        // Execute the query and fetch results
        const response = await this.connection.query(query).toPromise();

        console.log("---------------- RESPONSE ----------------------");
        console.log(response);
        console.log("---------------- RESPONSE ----------------------");

        return response;

    } catch (error) {
        // Handle any errors that occur
        console.error('Error querying ClickHouse:', error);
    }
  }

}

module.exports = ClickhouseRepository;
