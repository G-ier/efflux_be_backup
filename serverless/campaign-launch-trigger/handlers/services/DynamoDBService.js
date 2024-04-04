const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');

class DynamoDBService {
  static instance = null;

  static getInstance() {
    if (!DynamoDBService.instance) {
      DynamoDBService.instance = new DynamoDBService();
    }
    return DynamoDBService.instance;
  }

  constructor() {
    const dbClient = new DynamoDBClient({ region: 'us-east-1' });
    this.docClient = DynamoDBDocumentClient.from(dbClient);
  }

  async putItem(tableName, item) {
    try {
      const data = await this.docClient.send(
        new PutCommand({
          TableName: tableName,
          Item: item,
        }),
      );
    } catch (error) {
      console.error('Error adding item:', error);
    }
  }

  async getItem(
    tableName,
    partitionKeyName,
    partitionKeyValue,
    sortKeyName = null,
    sortKeyValue = null,
  ) {
    try {
      let key = {
        [partitionKeyName]: partitionKeyValue,
      };

      if (sortKeyName !== null && sortKeyValue !== null) {
        key[sortKeyName] = sortKeyValue;
      }
      const data = await this.docClient.send(
        new GetCommand({
          TableName: tableName,
          Key: key,
        }),
      );
      return data.Item;
    } catch (error) {
      console.error('Error retrieving item:', error);
    }
  }

  async queryItems(tableName, queryParams) {
    const params = {
      TableName: tableName,
      ...queryParams,
    };

    try {
      const data = await this.docClient.send(new QueryCommand(params));
      return data.Items;
    } catch (error) {
      console.error('Error querying items by partition key:', error);
    }
  }

  async scanItems(tableName) {
    const params = {
      TableName: tableName,
    };

    try {
      const data = await this.docClient.send(new ScanCommand(params));
      return data.Items;
    } catch (error) {
      console.error('Error scanning items:', error);
    }
  }
}

const dynamoDBService = DynamoDBService.getInstance();
module.exports = dynamoDBService;
