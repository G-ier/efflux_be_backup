const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const sqsClient = new SQSClient({ region: 'us-east-1' });
const AdLauncherService = require('../src/modules/adLauncher/service/AdLauncherService');

// TODO: Update these values to use AWS parameter store or environment variables
const queueUrl = 'https://sqs.us-east-1.amazonaws.com/524744845066/campaigns-ready-to-launch';

async function processMessage(message) {
  const adLauncherService = new AdLauncherService();
  try {
    console.debug('Raw message:', message);
    console.debug(`✅ Processing message: ${message.MessageId}`);
    // parse SQS message
    const messageBody = JSON.parse(message.Body);
    console.debug('Message Body:', messageBody);

    console.log('Launch the campaign with everything');
  } catch (error) {
    console.log(`Error processing message: ${error}`);
  }
}

async function pollSQSQueue() {
  try {
    const receiveParams = {
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 5, // Adjust based on throughput needs
      WaitTimeSeconds: 20, // Long polling
    };

    while (true) {
      const receivedMessages = await sqsClient.send(new ReceiveMessageCommand(receiveParams));

      if (receivedMessages.Messages && receivedMessages.Messages.length > 0) {
        for (const message of receivedMessages.Messages) {
          await processMessage(message);

          // Delete the message from the queue
          const deleteParams = {
            QueueUrl: queueUrl,
            ReceiptHandle: message.ReceiptHandle,
          };
          await sqsClient.send(new DeleteMessageCommand(deleteParams));
        }
      }
    }
  } catch (error) {
    console.error('An error occurred while polling the queue:', error);
  }
}

module.exports = { pollSQSQueue };
