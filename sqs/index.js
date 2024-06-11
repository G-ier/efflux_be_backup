const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");
const sqsClient = new SQSClient({ region: "us-east-1" });
const AdLauncherController = require("../src/modules/facebook/controllers/AdLauncherController");
const notificationsServiceInstance = require("../src/shared/lib/NotificationsService");
const { FacebookLogger } = require("../src/shared/lib/WinstonLogger");


// TODO: Update these values to use AWS parameter store or environment variables
const queueUrl = 'https://sqs.us-east-1.amazonaws.com/033156084586/campaigns-ready-to-launch'; // correct value

async function processMessage(message) {
  const adLauncherController = new AdLauncherController();
  try {
    // parse SQS message
    const messageBody = JSON.parse(message.Body);
    FacebookLogger.info(`Message Body: ${JSON.stringify(messageBody)}`);

    const payload = {
      body: messageBody,
    }
    const userId = messageBody.userId;
    // retry mechanism for automatic launching -- retries max 3 times
    let pause = 2;
    let counter = 0;
    const max_retry = 4;
    let error = false;
    let response;
    for(counter; counter<max_retry; counter++){
      response = await adLauncherController.launchAd(payload).catch(async error => {
        FacebookLogger.info(`Ad Launching failed --- lambda version ---`);
        FacebookLogger.info(`${error}`);
        FacebookLogger.info(`Ad Launching error above --- lambda version ---`);
        await Promise(resolve => setImmediate(() => setTimeout(resolve, pause*1000)));
        pause = 2*pause;
        error = true;
      });
      if(error){
        if(counter <= 3){
          error = false;
          continue;
        }
      } else {
        counter = 5;
      }
    }

    await notificationsServiceInstance.notifyUser(
      response.success ? "Campaign Launched Successfully" : "Campaign Launch Failed",
      response.success ? response.message : response.error,
      userId
    );
    if (!response.success) {
      FacebookLogger.error(`Error launching campaign: ${JSON.stringify(response.error)}`);
    } else {
      FacebookLogger.info("Campaign Launched Successfully")
    }
  } catch (error) {
    FacebookLogger.error(JSON.stringify(error));
    FacebookLogger.error(`Error processing message: ${JSON.stringify(error)}`);
    FacebookLogger.error(`Error processing message: ${error}`);
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
