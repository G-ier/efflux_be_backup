const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: process.env.SQS_PUSHER_ACCESS_KEY_ID,
  secretAccessKey: process.env.SQS_PUSHER_SECRET_KEY,
  region: 'us-east-1',
});

// Now you can create service clients or call AWS services.
class SqsService {
  constructor(queueUrl) {
    this.sqs = new AWS.SQS();
    this.queueUrl = queueUrl;
  }

  async sendMessageToQueue(event) {
    const params = {
      MessageBody: JSON.stringify(event),
      QueueUrl: this.queueUrl,
    };

    try {
      const data = await this.sqs.sendMessage(params).promise();
    } catch (error) {
      console.error(`Error sending message to SQS queue: ${error}`);
    }
  }
}

module.exports = SqsService;
