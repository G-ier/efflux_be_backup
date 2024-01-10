const AWS = require('aws-sdk');
const EnvironmentVariablesManager = require('../services/EnvironmentVariablesManager');

AWS.config.update({
  accessKeyId: EnvironmentVariablesManager.getEnvVariable('SQS_PUSHER_ACCESS_KEY_ID'),
  secretAccessKey: EnvironmentVariablesManager.getEnvVariable('SQS_PUSHER_SECRET_KEY'),
  region: 'us-east-1',
});

// Now you can create service clients or call AWS services.
class SqsService {

  constructor(queueUrl) {
    this.sqs = new AWS.SQS();
    this.queueUrl = queueUrl;
  }

  async sendMessageToQueue(event) {

    //TODO: Temporary disabled. Enable when update to BatchWriteItem
    return

    const params = {
      MessageBody: JSON.stringify(event),
      QueueUrl: this.queueUrl,
    };

    try {
      const data = await this.sqs.sendMessage(params).promise();
      console.log(`Message sent to SQS queue: ${data.MessageId}`);
    } catch (error) {
      console.error(`Error sending message to SQS queue: ${error}`);
    }

  }
}

module.exports = SqsService;
