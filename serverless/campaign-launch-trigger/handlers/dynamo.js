'use strict';
// Local Application Imports
const cronJobService = require('./CronJobsService');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const sqsClient = new SQSClient({ region: 'us-east-1' });

const SqsQueueUrl =
  process.env.SQS_QUEUE_URL ||
  'https://sqs.us-east-1.amazonaws.com/524744845066/ready-to-launch-campaigns';

  /** fet */
exports.handler = async (event) => {
  console.debug('Event: ', JSON.stringify(event, null, 2));

  // Process each record in the event
  for (let record of event.Records) {
    // Check if the record is an INSERT event
    if (record.eventName === 'INSERT') {
      // Use `unmarshall` to convert the DynamoDB format to a standard JavaScript object
      const executionLogRow = unmarshall(record.dynamodb.NewImage);

      console.debug('Execution log row:', executionLogRow);

      const fetchingKeyType = executionLogRow.type === 'spend' ? 'partitionKey' : 'rangeKey';



          // Send message to SQS
          await sendMessageToQueue(message);
        }
      }
    }
  }

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
