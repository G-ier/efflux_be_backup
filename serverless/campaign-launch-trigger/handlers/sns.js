'use strict';
// Local Application Imports
const cronJobService = require('./CronJobsService');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const sqsClient = new SQSClient({ region: 'us-east-1' });

const SnsTopicArn =
  process.env.SNS_TOPIC_ARN ||
  'arn:aws:sns:us-east-1:524744845066:Mediamaster-Downstream-Notifications';

const SqsQueueUrl =
  process.env.SQS_QUEUE_URL ||
  'https://sqs.us-east-1.amazonaws.com/524744845066/ready-to-launch-campaigns';

const DynamodbTableName = process.env.DYNAMODB_TABLE_NAME || 'in-progress-campaigns';

/**
 * Step 1: Receives message from SNS topic
 * Step 2: queries dynamoDB table for the campaign details using the key "internal_campaign_id" from the message payload
 * Step 3: if the status field is "published" then sends a message to SQS queue
 * @param {Object} event - SNS message
 * @returns {Promise<string>}
 * @example
 * {
 *  "Records": [
 *   {
 *    "EventSource": "aws:sns",
 *   "EventVersion": "1.0",
 *  "EventSubscriptionArn": "arn:aws:sns:us-east-1:524744845066:Mediamaster-Downstream-Notifications:4b5d6b9c-4e3b-4c4b-8c5b-3c4b5d6e7b8c",
 * "Sns": {
 * "Type": "Notification",
 * "MessageId": "e1b5c2d4-5b6c-4d5e-8b5c-2d4e5b6c7d8e",
 * "TopicArn": "arn:aws:sns:us-east-1:524744845066:Mediamaster-Downstream-Notifications",
 * "Subject": "Campaign Published",
 * "Message": "{\"internal_campaign_id\":\"1234\"}",
 * "Timestamp": "2021-10-14T20:45:19.000Z",
 * "SignatureVersion": "1",
 * "Signature": "EXAMPLE",
 * "SigningCertUrl": "EXAMPLE",
 * "UnsubscribeUrl": "EXAMPLE",
 * "MessageAttributes": {}
 *
 */
exports.handler = async (event) => {
  console.debug('Event: ', JSON.stringify(event, null, 2));

  // Send message to SQS
  await sendMessageToQueue(message);

  return `Successfully processed ${event.Records.length} records.`;
};

async function sendMessageToQueue(event) {
  const params = {
    MessageBody: JSON.stringify(event),
    QueueUrl: SqsQueueUrl,
  };

  try {
    const data = await sqsClient.send(new SendMessageCommand(params));
    console.debug(`Message sent to SQS queue: ${data.MessageId}`);
  } catch (error) {
    console.error(`❌ Error sending message to SQS queue: ${error}`);
  }
}
