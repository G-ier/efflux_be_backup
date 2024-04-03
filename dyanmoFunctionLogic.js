const fs = require('fs').promises; // Node.js File System module with Promises
const dynamoService = require('./src/shared/lib/DynamoDBService');
const SqsService = require('./src/shared/lib/SQSService');

//Constants
const eventsFromMediaMasterSQS = 'https://sqs.us-east-1.amazonaws.com/524744845066/ready-to-launch-campaigns'
const sqsService = new SqsService(eventsFromMediaMasterSQS);

// Methods
const populateMediaLibraryDynamoDBTable = async () => {
  const Item = {
    id: 1,
    internal_campaign_id: 'as9d0asd90as',
    adAccountId: '1234567890',
    s3Key: 'value',
    createdAt: new Date().toISOString(),
    labels: ['label1', 'label2'],
    fbhash: '1823ux98c8a089ca09ca90a',
  }
  try {
    await dynamoService.putItem("efflux-media-library", Item);
  } catch (error) {
    console.error('Error:', error);
  }

}

// Main function
const main = async () => {

  try {

    // This will be replaced with a DynamoDB stream that will be marshalled to this function
    const data = await fs.readFile('facebook-launching-examples.json', 'utf8');
    const launchData = JSON.parse(data);

    // Check if there is existing media with the same internal_campaign_id
    const existingCampaignMedia = await dynamoService.queryItems("efflux-media-library", {
      KeyConditionExpression: "internal_campaign_id = :internal_campaign_id",
      ExpressionAttributeValues: {
        ":internal_campaign_id": launchData.internal_campaign_id
      }
    });

    // If there is an existing media with the same internal_campaign_id, send a message to the Queue to Launch
    if (existingCampaignMedia.length) {
      launchData.image_hash = existingCampaignMedia[0].fbhash;
      console.log('Send a launch signal to the Queue');
      await sqsService.sendMessageToQueue(launchData);
    }

    // Otherwise, return without doing anything
    else {
      console.log('No existing media with the same internal_campaign_id');
      return;
    }

  } catch (error) {
    console.error('Error:', error);
  }
};

main();
