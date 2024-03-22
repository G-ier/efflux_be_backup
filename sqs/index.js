const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");
const sqsClient = new SQSClient({ region: "us-east-1" });
const AdLauncherService = require("../src/modules/adLauncher/service/AdLauncherService");

// TODO: Update these values to use AWS parameter store or environment variables
const queueUrl = "https://sqs.us-east-1.amazonaws.com/524744845066/event-from-media-master";
const bucketName = "efflux-media-master";

async function processMessage(message) {
  const adLauncherService = new AdLauncherService();
  try {
    console.debug("Raw message:", message);
    console.debug(`✅ Processing message: ${message.MessageId}`);
    // parse SQS message
    const messageBody = JSON.parse(message.Body);
    console.debug("Message Body:", messageBody);
    const parsedBody = JSON.parse(messageBody.Message);
    console.debug("parsedBody Message Body:", parsedBody);

    // process the message
    const { type, adAccountId, s3Key } = parsedBody;

    adLauncherService.submitFacebookAd(type, adAccountId, imageBuffer);

  } catch (error) {
    console.log(`Error processing message: ${error}`);
  }
}

async function getS3Object(getObjectParams) {
  const stream = await s3Client.send(new GetObjectCommand(getObjectParams)).then((response) => response.Body);

  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.once("end", () => resolve(Buffer.concat(chunks)));
    stream.once("error", reject);
  });
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
    console.error("An error occurred while polling the queue:", error);
  }
}

module.exports = { pollSQSQueue };
