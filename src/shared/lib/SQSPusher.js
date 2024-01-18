const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const sqsClient = new SQSClient({
  region: 'us-east-1',
});

class SqsService {
  constructor(queueUrl) {
    this.queueUrl = queueUrl;
  }

  async sendMessageToQueue(event) {
    const params = {
      MessageBody: JSON.stringify(event),
      QueueUrl: this.queueUrl,
    };

    try {
      const data = await sqsClient.send(new SendMessageCommand(params));
      console.log(`Message sent to SQS queue: ${data.MessageId}`);
    } catch (error) {
      console.error(`Error sending message to SQS queue: ${error}`);
    }
  }
}

module.exports = SqsService;
