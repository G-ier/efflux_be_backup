'use strict';

// Local Application Imports
const dynamoClient = require('./services/DynamoDBService');
const dynamoDbTable = process.env.DYNAMODB_TABLE_NAME;

exports.handler = async (event) => {
  console.debug('Event: ', JSON.stringify(event, null, 2));
  console.debug('DynamoDB Table: ', dynamoDbTable);

  try {
    const message = JSON.parse(event.Records[0].body);
    console.debug('Message: ', message);
    await dynamoClient.putItem('in-progress-campaigns', message);
    console.debug('Item added to DynamoDB');
  } catch(error) {
    console.error(`Error writing to DynamoDB ${error}`);
    return {
      statusCode: 500,
    };
  }

  return {
    statusCode: 200,
  };
};
