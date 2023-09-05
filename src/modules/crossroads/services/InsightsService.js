const InsightsRepository = require("../repositories/InsightsRepository");
const axios = require("axios");
const { CROSSROADS_URL } = require("../constants");
const { todayM } = require("../helpers");
const fs = require("fs");
const _ = require("lodash");
const { sendSlackNotification } = require("../../../../services/slackNotificationService");
const CampaignService = require("./CampaignService");

class InsightsService {
  constructor() {
    this.repository = new InsightsRepository();
    this.campaignService = new CampaignService();
  }

  async getAvailableFields(key) {
    const { data } = await axios.get(`${CROSSROADS_URL}get-available-fields?key=${key}`);
    return data.available_fields;
  }

  async prepareBulkData(key, date, fields) {
    const url = `${CROSSROADS_URL}prepare-bulk-data?key=${key}&date=${date}&format=json&extra-fields=${fields}`;
    const { data } = await axios.get(url).catch((err) => {
      console.error("prepare request error", err.response);
      throw err;
    });
    return data;
  }

  async prepareBulkData(key, date, fields) {
    const url = `${CROSSROADS_URL}prepare-bulk-data?key=${key}&date=${date}&format=json&extra-fields=${fields}`;
    const { data } = await axios.get(url).catch((err) => {
      console.error("prepare request error", err.response);
      throw err;
    });
    return data;
  }

  async getBulkData(url) {
    const { data } = await axios.get(url);
    return data;
  }
  async getRequestState(key, requestId) {
    const url = `${CROSSROADS_URL}get-request-state?key=${key}&request-id=${requestId}`;
    const { data } = await axios.get(url);
    return data;
  }

  waitForBulkData(key, requestId) {
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

    console.log("retryCallsIn30Minutes", retryCallsIn30Minutes, typeof retryCallsIn30Minutes);
    console.log("currentMinute", currentMinute, typeof currentMinute);
    console.log("isFinalAttempt", isFinalAttempt, typeof isFinalAttempt);
    console.log("maxRetryCalls", maxRetryCalls, typeof maxRetryCalls);

    return new Promise((resolve, reject) => {
      let count = 0;

      const interval = setInterval(async () => {
        const { status_code, file_url } = await this.getRequestState(key, requestId);
        console.log(status_code);
        if (status_code !== 200 && count <= maxRetryCalls) {
          console.log("retrying", count);
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
  }

  async updateCrossroadsData(account, request_date) {
    try {
      // 1) CROSSROADS API CALL : getAvailableFields
      const available_fields = await this.getAvailableFields(account.key);
      const fields = available_fields.join(",");

      // 2) CROSSROADS API CALL : prepareBulkData
      const { request_id } = await this.prepareBulkData(account.key, request_date, fields);

      // 3) CROSSROADS API CALL : waitForBulkData
      let file_url;
      try {
        file_url = await this.waitForBulkData(account.key, request_id);
      } catch (error) {
        console.log("error", error);
        await sendSlackNotification(`Crossroads Data Update\nError: \n${error.toString()}`);
        return;
      }

      // 4) CROSSROADS API CALL : getBulkData
      const crossroadsData = await this.getBulkData(file_url);
      await this.repository.upsert(crossroadsData, account.id, request_date);
    } catch (err) {
      console.log(err);
      if (!err.status_code === 429) {
        await sendSlackNotification(`Crossroads Data Update\nError: \n${err.toString()}`);
      }
    }
  }

  async fetchDataFromAPI(apiKey, date) {
    const { data } = await axios.get(`${CROSSROADS_URL}some-endpoint?key=${apiKey}&date=${date}`);
    return data;
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
