const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");

class DynamoRepository {
  constructor(region = "us-east-1") {
    this.client = new DynamoDBClient({ region });
    this.tableName = "efflux-media-library"
  }

  // Existing getItem method...

  async scanItemsByAdAccountIdAndFbhash({ adAccountId }) {
    // Construct the command
    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: "adAccountId = :adAccountIdValue AND attribute_exists(fbhash)",
      ExpressionAttributeValues: {
        ":adAccountIdValue": { S: adAccountId.toString() },
      },
    });

    // Execute the command
    const response = await this.client.send(command);

    // Return the items
    return response.Items;
  }
}

module.exports = DynamoRepository;
