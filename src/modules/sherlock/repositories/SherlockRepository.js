// Third party imports
const _ = require('lodash');

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { ExecuteStatementCommand, DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);

// Local application imports
const { cleanData, formatDateToISO } = require('../utils');

class SherlockRepository {
  constructor() {
    this.tableName = 'sherlock-findings';
  }

  async findingsDaily(params) {
    const { startDate, endDate, orgId } = params;
    console.log('START DATE: ', startDate);
    console.log('END DATE: ', endDate);
    console.log('ORG ID: ', orgId);

    const result = await this.queryFindingsDaily(startDate, endDate, orgId);
    return _.groupBy(result, 'created_at');
  }

  async queryFindingsDaily(startDate, endDate, orgId) {
    const command = new ExecuteStatementCommand({
      Statement: `SELECT * FROM "${this.tableName}" WHERE "org_id" = ? AND "created_at" BETWEEN ? AND ?`,
      Parameters: [orgId.toString(), startDate, endDate],
    });

    // console.debug('command:', command.input.Parameters);

    try {
      const data = await docClient.send(command);
      console.log('returning data:', data);
      return cleanData(data.Items);
    } catch (error) {
      console.error('Error querying data:', error);
      throw error;
    }
  }
}

module.exports = SherlockRepository;
