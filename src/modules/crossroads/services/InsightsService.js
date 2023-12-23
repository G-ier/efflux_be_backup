const InsightsRepository = require("../repositories/InsightsRepository");
const axios = require("axios");
const { CROSSROADS_URL } = require("../constants");
const { todayM } = require("../helpers");
const fs = require("fs");
const path = require('path');

const _ = require("lodash");
const CampaignService = require("./CampaignService");
const { CrossroadsLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");

class InsightsService extends BaseService {

  constructor() {
    super(CrossroadsLogger);
    this.repository = new InsightsRepository();
    this.campaignService = new CampaignService();
  }

  async getAvailableFields(key) {
    CrossroadsLogger.info("Getting available fields from crossroads")
    const data = await this.fetchFromApi(`${CROSSROADS_URL}get-available-fields`, { key }, "Error getting available fields");
    return data.available_fields;
  }

  async prepareBulkData(key, date, fields) {
    CrossroadsLogger.info("Requesting Crossroads to Prepare Bulk data")
    return await this.fetchFromApi(`${CROSSROADS_URL}prepare-bulk-data`, { key, date, format: 'json', 'extra-fields': fields }, "Error requesting crossroads to prepare bulk data");
  }

  async getRequestState(key, requestId, attempt) {
    if (attempt > 0) CrossroadsLogger.info(`Retrying to get request state. Retry Attempt: ${attempt}`)
    return await this.fetchFromApi(`${CROSSROADS_URL}get-request-state`, { key, 'request-id': requestId }, "Error getting request state");
  }

  waitForBulkData(key, requestId) {

    const periodicStateRequest = async (key, requestId) => {
      const retryLogUrl = "./apiRetries.json";
      const maxRetryCallsIn30Minuts = 5;
      const data = fs.readFileSync(retryLogUrl);
      const { retryCallsIn30Minutes } = JSON.parse(data);
      const currentMinute = todayM();
      const isFinalAttempt = (currentMinute >= 20 && currentMinute < 30) || (currentMinute >= 50 && currentMinute < 60);

      let maxRetryCalls;

      if (isFinalAttempt) {
        // Calculate the retry calls
        maxRetryCalls = maxRetryCallsIn30Minuts - retryCallsIn30Minutes;
      } else {
        // Set the retry calls
        maxRetryCalls = 2;
      }

      return new Promise((resolve, reject) => {

        let count = 0;

        const interval = setInterval(async () => {

          const { status_code, file_url } = await this.getRequestState(key, requestId, count);

          if (status_code !== 200 && count <= maxRetryCalls) {
            count++;
            return;
          }

          clearInterval(interval);

          if (isFinalAttempt) {
            // Reset the retry calls
            fs.writeFileSync(retryLogUrl, JSON.stringify({ retryCallsIn30Minutes: 0 }));
          } else {
            // Increment the retry calls
            const increment = count > maxRetryCalls ? count - 1 : count;
            fs.writeFileSync(retryLogUrl, JSON.stringify({ retryCallsIn30Minutes: retryCallsIn30Minutes + increment }));
          }

          // Call the slack api here to send a message to the channel
          if (status_code === 200) resolve(file_url);
          else reject(status_code);
        }, 60000);

        fs.writeFileSync(retryLogUrl, JSON.stringify({ retryCallsIn30Minutes: retryCallsIn30Minutes + count }));
      });
    };

    CrossroadsLogger.info("Periodically checking if the bulk data is ready")
    return this.executeWithLogging(
      () => periodicStateRequest(key, requestId),
      "Error waiting for bulk data from crossroads"
    );

  }

  async getBulkData(url) {
    CrossroadsLogger.info("Fetching bulk data from crossroads")
    const { data } = await axios.get(url);
    return data;
  }

  async getTrafficSourceNakedLinks(key, campaign_id) {
    this.logger.info("Getting traffic source naked links")
    return await this.fetchFromApi(`${CROSSROADS_URL}get-traffic-sources`, { key, campaign_id }, "Error getting traffic source naked links");
  }

  async updateCrossroadsData(account, request_date, saveAggregated=true, saveRawData = false, saveRawDataToFile = false, campaignIdRestrictions = []) {

    if (!saveAggregated && !saveRawData) {
      CrossroadsLogger.info("No data to save. Skipping crossroads data update");
      return;
    }

    const available_fields = await this.getAvailableFields(account.key);
    const fields = available_fields.join(",");
    const { request_id } = await this.prepareBulkData(account.key, request_date, fields);
    const file_url = await this.waitForBulkData(account.key, request_id);
    const crossroadsData = await this.getBulkData(file_url);

    if (saveRawDataToFile) {
      // Save the data to a JSON file
      const filePath = path.join(__dirname, '../testData/', `${account.id}_${request_date}.json`);
      fs.writeFileSync(filePath, JSON.stringify(crossroadsData, null, 2));
      CrossroadsLogger.info(`Saved crossroads data to ${filePath}`);
    }

    if (saveRawData) {
      // Save the raw data to the database
      CrossroadsLogger.info("Saving raw data to the database");
      await this.executeWithLogging(
        () => this.repository.saveRawData(crossroadsData, account.id, request_date, campaignIdRestrictions),
        "Error saving raw data"
      );
    }

    if (saveAggregated) {
      // Save the aggregated data to the database
      CrossroadsLogger.info("Upserting crossroads data to the database");
      await this.executeWithLogging(
          () => this.repository.testUpsert(crossroadsData, account.id, request_date),
          "Error processing and upserting bulk data"
      );
    }

    CrossroadsLogger.info("Finished crossroads data update");
  }

  async queryCrossroadsData(accountId, requestDate, queryKey, queryValue) {

    const filePath = path.join(__dirname, '../testData/', `${accountId}_${requestDate}.json`);

    // Read the data from the file
    const fileData = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(fileData);

    // Filter data based on the queryKey
    return jsonData.filter(data => {
      // Adjust this condition as per your requirements
      return data[queryKey] === queryValue;
    });
  }

  async getCrossroadsById(id) {
    const filters = { id }; // Assuming the column name for the ID is 'id'
    const results = await this.repository.fetchInsights(["*"], filters, 1);
    return results[0]; // Since we expect only one record with the given ID, we return the first result
  }

  async getAllCrossroads() {
    return this.repository.fetchInsights(); // Fetch all records without any filters or limits
  }

  async deleteCrossroadsById(id) {
    return this.repository.delete({ id });
  }

}

module.exports = InsightsService;
