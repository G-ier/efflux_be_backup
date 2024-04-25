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
  console.debug('Event: ', JSON.stringify(event, null, 2))
  // Process each record in the event
  for (let record of event.Records) {
    // Check if the record is an INSERT event
    if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
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
        
        const image_hashes = []
        if (launchData.media_files && launchData.media_files.length > 0) {
          existingCampaignMedia.filter(campaignMedia => {
            return launchData.media_files.some(filename => {
              if (campaignMedia.rawKey.includes(filename)) {
                image_hashes.push({ hash: campaignMedia.fbhash })
              }
            });
          });
          const uniqueImageHashes = [...new Set(image_hashes)];
          launchData.adData.creative.image_hashes = uniqueImageHashes
          console.debug('Multiple media files found for the same internal_campaign_id', launchData.adData.creative.image_hashes);
        } else {
          launchData.adData.creative.image_hashes = [{
            hash: existingCampaignMedia[0].fbhash
          }]
        }
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
