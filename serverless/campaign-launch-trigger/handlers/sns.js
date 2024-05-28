'use strict';
// Local Application Imports

const SqsQueueUrl =
  process.env.SQS_QUEUE_URL ||
  'https://sqs.us-east-1.amazonaws.com/033156084586/launch-signal-queue';

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

  // Step 1: Receives message from SQS
  const message = JSON.parse(event.Records[0].body);
  const QueueMessage = JSON.parse(message.Message);
  console.debug('Message: ', message);
  console.debug('Internal Campaign ID: ', QueueMessage.internalCampaignId);

  // Step 2: queries dynamoDB table for the campaign details using the key "internalCampaignId" from the message payload
  const launchingData = await dynamoClient.queryItems(DynamodbTableName, {
    KeyConditionExpression: 'internal_campaign_id = :internal_campaign_id',
    ExpressionAttributeValues: {
      ':internal_campaign_id': QueueMessage.internalCampaignId,
    },
  });
  console.debug('Campaign: ', launchingData);
  if (launchingData.length) {
    const launchData = launchingData[0];

    // Step 3: Compare the number of files that have been uploaded with the number of files the launching is supposed to have
    const alledgedFilesNumber = launchData.media_files.length;
    console.log('Alledged files number: ', alledgedFilesNumber);
    const uploadedFiles = await dynamoClient.queryItems('efflux-media-library', {
      KeyConditionExpression: 'internal_campaign_id = :internal_campaign_id',
      ExpressionAttributeValues: {
        ':internal_campaign_id': QueueMessage.internalCampaignId,
      },
    });
    console.log('Current files number: ', uploadedFiles.length);

    // If the number of uploaded files is equal to the number of alledged files, send a launch signal to the Queue
    if (uploadedFiles.length === alledgedFilesNumber) {

      console.log('Current files: ', uploadedFiles);
      const image_hashes = [];
      const video_ids = [];
      const video_thumbnail_urls = [];

      if (
        launchData.media_files &&
        launchData.media_files.length > 0 &&
        launchData.adsetData.is_dynamic_creative
      ) {
        uploadedFiles.filter((campaignMedia) => {
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
        console.debug('Show media type', uploadedFiles[0]);
        if (uploadedFiles[0].mediaType === 'video') {
          launchData.adData.creative.video_ids = [uploadedFiles[0].fbhash];
          launchData.adData.creative.thumbnails = [uploadedFiles[0].thumbnails];
        } else {
          launchData.adData.creative.image_hashes = [{ hash: uploadedFiles[0].fbhash }];
        }
      }

      console.debug('Final Launch Data: ', JSON.stringify(launchData, null, 2));
      await sqsClient.sendMessageToQueue(launchData);
      console.log('Sending a launch signal to the Queue');
      return `Successfully sent a launch signal to the Queue for campaign with internalCampaignId: ${QueueMessage.internalCampaignId}`;
    }

  } else {
    console.log(
      'No campaign in progress found for internal campaign id: ',
      QueueMessage.internalCampaignId,
    );
    return `No campaign in progress found for internal campaign id: ${QueueMessage.internalCampaignId}`;
  }
};
