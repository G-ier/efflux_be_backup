'use strict';

// Services
const dynamoClient = require('./services/DynamoDBService');
const SqsService = require('./services/SQSService');

// Constants
const dynamoDbTable = process.env.DYNAMODB_TABLE_NAME;
const mediaLibraryDynamoDbTable = process.env.EFFLUX_MEDIA_LIBRAY_TABLE;
const readyToLaunchQueue =
  process.env.SQS_QUEUE_URL ||
  'https://sqs.us-east-1.amazonaws.com/033156084586/campaigns-ready-to-launch';
const sqsClient = new SqsService(readyToLaunchQueue);

exports.handler = async (event) => {
  console.debug('DynamoDB Table: ', dynamoDbTable);
  console.debug('Media Library DynamoDB Table: ', mediaLibraryDynamoDbTable);
  console.debug('Ready to Launch Queue: ', readyToLaunchQueue);
  console.debug('Event: ', JSON.stringify(event, null, 2));
  const message = JSON.parse(event.Records[0].body);
  const internalCampaignId = message.internal_campaign_id;
  console.debug('Message: ', message);
  console.debug('Internal Campaign ID: ', internalCampaignId);

  try {
    // Step 1: Read the status of the campaign from the DynamoDB table
    const launchingData = await dynamoClient.queryItems(dynamoDbTable, {
      KeyConditionExpression: 'internal_campaign_id = :internal_campaign_id',
      ExpressionAttributeValues: {
        ':internal_campaign_id': internalCampaignId,
      },
    });
    const launchData = launchingData[0];
    const status = launchData.status;
    console.debug('Campaign Status: ', status);

    // Step 2: Check if the campaign has already been launched, return if it has
    if (status === 'launched') {
      console.debug('Campaign has already been launched');
      return {
        statusCode: 200,
      };
    }
    // Step 3: Check if the campaign is still in draft, launch it if it is
    else if (status === 'draft') {
      console.debug('Sending campaign to the queue');

      // Step 3.1: Update the status of the campaign to launching
      await dynamoClient.updateItem(dynamoDbTable,
        {internal_campaign_id: internalCampaignId},
        {status: 'launching'}
      );

      // Step 3.2: Send the campaign to the queue to launch it
      await sqsClient.sendMessageToQueue(message);

      return {
        statusCode: 200,
      };
    }

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
