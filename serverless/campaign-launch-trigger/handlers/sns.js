'use strict';
// Local Application Imports

const SqsQueueUrl =
  process.env.SQS_QUEUE_URL ||
  'https://sqs.us-east-1.amazonaws.com/524744845066/campaigns-ready-to-launch';

const DynamodbTableName = process.env.DYNAMODB_TABLE_NAME || 'in-progress-campaigns';

const SqsService = require('./services/SQSService');
const DynamoService = require('./services/DynamoDBService');

const sqsClient = new SqsService(SqsQueueUrl);
const dynamoClient = DynamoService;

/**
 * Step 1: Receives message from SNS topic
 * Step 2: queries dynamoDB table for the campaign details using the key "internalCampaignId" from the message payload
 * Step 3: If there is an existing media with the same internal_campaign_id, send a message to the Queue to Launch
 * @param {Object} event - SNS message
 * @returns {Promise<string>}
 */

exports.handler = async (event) => {
  console.debug('Event: ', JSON.stringify(event, null, 2));

  // Step 1
  const message = JSON.parse(event.Records[0].Sns.Message);
  console.debug('Message: ', message);
  console.debug('Internal Campaign ID: ', message.internalCampaignId);

  // Step 2
  const launchingData = await dynamoClient.queryItems(DynamodbTableName, {
    KeyConditionExpression: 'internal_campaign_id = :internal_campaign_id',
    ExpressionAttributeValues: {
      ':internal_campaign_id': message.internalCampaignId,
    },
  });

  console.debug('Campaign: ', launchingData);

  // Step 3
  if (launchingData.length) {
    const launchData = launchingData[0];
    launchData.adData.creative.image_hashes = [
      {
        hash: message.fbhash,
      },
    ];
    await sqsClient.sendMessageToQueue(message);
    console.log('Sending a launch signal to the Queue');
    return `Successfully sent a launch signal to the Queue for campaign with internalCampaignId: ${message.internalCampaignId}`;
  } else {
    console.log(
      'No campaign in progress found for internal campaign id: ',
      message.internalCampaignId,
    );
    return `No campaign in progress found for internal campaign id: ${message.internalCampaignId}`;
  }
};
