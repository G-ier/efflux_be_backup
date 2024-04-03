// Third Party Imports
const cronParser = require("cron-parser");

// Local Imports
const dynamoDBService = require("./DynamoDBService");

class CronJobService {
  static instance = null;

  static getInstance() {
    if (!CronJobService.instance) {
      CronJobService.instance = new CronJobService(dynamoDBService);
    }
    return CronJobService.instance;
  }

  constructor() {
    if (CronJobService.instance) {
      throw new Error("You can only create one instance of CronJobService!");
    }
    this.dynamoDBService = dynamoDBService;
    this.cronJobs = [];
  }

  async addCronJob(item) {
    await this.dynamoDBService.putItem("cron-jobs", item);
  }

  async addCronJobRelation(item) {
    await this.dynamoDBService.putItem("cron-job-pairs", item);
  }

  async addFinishedCronExecutionLoh(item) {
    await this.dynamoDBService.putItem("cron-execution-log", item);
  }

  async getFinishedJobsAfterTimestamp(jobId, timestamp) {
    const queryParams = {
      KeyConditionExpression: "job_id = :jobId AND finished_at > :timestamp",
      ExpressionAttributeValues: {
        ":jobId": jobId,
        ":timestamp": timestamp,
      },
      ScanIndexForward: true, // Ensures results are returned in ascending order based on the range key
    };
    try {
      return await this.dynamoDBService.queryItems("cron-execution-log", queryParams);
    } catch (error) {
      console.error("Error querying finished cron jobs:", error);
      throw error;
    }
  }

  async getCronJobData(cronJobID) {
    return await this.dynamoDBService.getItem("cron-jobs", "id", cronJobID);
  }

  async getCronJobRelations(keyValue, keyType = "partitionKey") {
    let keyConditionExpression = "";
    let expressionAttributeValues = {};
    let queryParams = {
      KeyConditionExpression: "",
      ExpressionAttributeValues: {},
    };

    if (keyType === "partitionKey") {
      // Querying directly by the table's partition key
      keyConditionExpression = `traffic_source_job_id = :partitionKeyValue`;
      expressionAttributeValues = { ":partitionKeyValue": keyValue };
      // Set query params without IndexName
    } else if (keyType === "rangeKey") {
      // Querying by the GSI's partition key (which is network_job_id in this case)
      keyConditionExpression = `network_job_id = :keyValue`;
      expressionAttributeValues = { ":keyValue": keyValue };
      queryParams.IndexName = "NetworkJobIdIndex"; // Specify the GSI name
    }

    queryParams.KeyConditionExpression = keyConditionExpression;
    queryParams.ExpressionAttributeValues = expressionAttributeValues;
    return await this.dynamoDBService.queryItems("cron-job-pairs", queryParams);
  }

  getLastTriggerTime(cronRule) {
    try {
      const options = {
        // Ensure the calculation is based on the current time
        currentDate: new Date(),
        utc: true, // Work in UTC
        iterator: true,
      };

      const interval = cronParser.parseExpression(cronRule, options);
      const prev = interval.prev(); // Get the previous occurrence from now

      if (prev.done) {
        console.log("No previous trigger time found.");
        return null;
      }

      const lastTriggerTime = prev.value.toDate();
      return lastTriggerTime.toISOString(); // Return the last trigger time in ISO format (UTC)
    } catch (err) {
      console.error("Error calculating the last trigger time:", err);
      return null;
    }
  }

  async loadAllCronRelations() {
    const cronRelations = await this.dynamoDBService.scanItems("cron-job-pairs");
    return cronRelations;
  }

  async loadAllCronJobs() {
    const cronJobs = await this.dynamoDBService.scanItems("cron-jobs");
    this.cronJobs = cronJobs;

    // Prevent modification from outside
    Object.freeze(this);
  }

  getSourceCronJobs(source) {
    return cronJobService.cronJobs.filter((cronJob) => cronJob.source === source);
  }
}

const cronJobService = CronJobService.getInstance();
module.exports = cronJobService;
