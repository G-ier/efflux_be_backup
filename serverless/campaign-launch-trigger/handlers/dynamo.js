'use strict';
// Local Application Imports
const { unmarshall } = require('@aws-sdk/util-dynamodb');

// Local Application Imports
const SQSService = require('./services/SQSService');
const dynamo = require('./services/DynamoDBService');

// Constants
const SqsQueueUrl =
  process.env.SQS_QUEUE_URL ||
  'https://sqs.us-east-1.amazonaws.com/524744845066/campaigns-ready-to-launch';

const sqsClient = new SQSService(SqsQueueUrl);
const dynamoClient = dynamo;

exports.handler = async (event) => {
  console.debug('Event: ', JSON.stringify(event, null, 2));

  // Process each record in the event
  for (let record of event.Records) {
    // Check if the record is an INSERT event
    if (record.eventName === 'INSERT') {
      // Use `unmarshall` to convert the DynamoDB format to a standard JavaScript object
      const launchData = unmarshall(record.dynamodb.NewImage);

      // Check if there is existing media with the same internal_campaign_id
      const existingCampaignMedia = await dynamoClient.queryItems('efflux-media-library', {
        KeyConditionExpression: 'internal_campaign_id = :internal_campaign_id',
        ExpressionAttributeValues: {
          ':internal_campaign_id': launchData.internal_campaign_id,
        },
      });

      // If there is an existing media with the same internal_campaign_id, send a message to the Queue to Launch
      if (existingCampaignMedia.length) {
        launchData.image_hash = existingCampaignMedia[0].fbhash;
        console.log('Sending a launch signal to the Queue');
        await sqsClient.sendMessageToQueue(launchData);
      }

      // Otherwise, return without doing anything
      else {
        console.log('No existing media with the same internal_campaign_id');
        return;
      }
    }
  }
};
