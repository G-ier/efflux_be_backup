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

      console.debug('existingCampaignMedia: ', JSON.stringify(existingCampaignMedia, null, 2));
      // If there is an existing media with the same internal_campaign_id, send a message to the Queue to Launch
      if (existingCampaignMedia.length) {
        const image_hashes = [];
        const video_ids = [];
        const video_thumbnail_urls = [];
        if (
          launchData.media_files &&
          launchData.media_files.length > 0 &&
          launchData.adsetData.is_dynamic_creative
        ) {
          existingCampaignMedia.filter((campaignMedia) => {
            return launchData.media_files.some((filename) => {
              if (campaignMedia.rawKey.includes(filename)) {
                if (campaignMedia.mediaType === 'video') {
                  video_ids.push(campaignMedia.fbhash);
                  video_thumbnail_urls.push(campaignMedia.thumbnails);
                } else {
                  image_hashes.push({ hash: campaignMedia.fbhash });
                }
              }
            });
          });
          // TODO: Send a message to user if media files contain duplicates
          const uniqueHashes = new Map(image_hashes.map((item) => [item.hash, item]));
          const uniqueArray = Array.from(uniqueHashes.values());

          const uniqueVideoIds = new Map(video_ids.map((item) => [item, item]));
          const newVideoArray = Array.from(uniqueVideoIds.values());

          const uniqueVideoThumbnails = new Map(video_thumbnail_urls.map((item) => [item, item]));
          const newVideoThumbnails = Array.from(uniqueVideoThumbnails.values());

          launchData.adData.creative.image_hashes = uniqueArray;
          launchData.adData.creative.video_ids = newVideoArray;
          launchData.adData.creative.thumbnails = newVideoThumbnails;

          console.debug(
            'Multiple media files found for the same internal_campaign_id',
            launchData.adData.creative.image_hashes,
          );
          console.debug(
            'Multiple video files found for the same internal_campaign_id',
            launchData.adData.creative.video_ids,
          );
        } else {
          console.debug('Show media type', existingCampaignMedia[0]);
          if (existingCampaignMedia[0].mediaType === 'video') {
            launchData.adData.creative.video_ids = [existingCampaignMedia[0].fbhash];
            launchData.adData.creative.thumbnails = [existingCampaignMedia[0].thumbnails];
          } else {
            launchData.adData.creative.image_hashes = [
              {
                hash: existingCampaignMedia[0].fbhash,
              },
            ];
          }
        }

        console.debug('Final Launch Data: ', JSON.stringify(launchData, null, 2));
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
