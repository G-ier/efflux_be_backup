const axios = require("axios");
const {
  TIKTOK_API_URL,
  TIKTOK_APP_ID,
  TIKTOK_APP_SECRET,
  TIKTOK_AD_ACCOUNT_AVAILABLE_FIELDS,
} = require("../constants");
const _ = require("lodash");
const AdAccountsRepository = require("../repositories/AdAccountRepository");

class AdAccountService {

  constructor() {
    this.adAccountsRepository = new AdAccountsRepository();
  }

  async getAdAccountDataFromApi(access_token, adAccountIds) {
    const availableFields = TIKTOK_AD_ACCOUNT_AVAILABLE_FIELDS; // You'd need to import TIKTOK_AD_ACCOUNT_AVAILABLE_FIELDS at the top.
    const endpoint = "advertiser/info";
    const url = `${TIKTOK_API_URL}/${endpoint}?`;

    const headers = {
      "Access-Token": access_token,
    };
    const params = new URLSearchParams({
      advertiser_ids: JSON.stringify(adAccountIds),
      fields: JSON.stringify(availableFields),
    });

    const response = await axios.get(url + params.toString(), { headers });

    if (response.data.code !== 0) {
      throw new Error("Error getting ad accounts info");
    }

    return response.data.data.list;
  }

  async getAdAccountsFromApi(access_token) {
    const endpoint = "oauth2/advertiser/get";
    const url = `${TIKTOK_API_URL}/${endpoint}?`;
    const headers = {
      "Access-Token": access_token,
    };
    const params = new URLSearchParams({
      app_id: TIKTOK_APP_ID,
      secret: TIKTOK_APP_SECRET,
    });

    const response = await axios.get(url + params.toString(), { headers });
    if (response.data.code !== 0) {
      throw new Error("Error getting ad accounts");
    }

    const adAccountsIds = response.data.data.list.map(({ advertiser_id }) => advertiser_id);
    const adAccountsData = await this.getAdAccountDataFromApi(access_token, adAccountsIds);

    return adAccountsData;
  }

  async syncAdAccounts(access_token, account_id, user_id) {
    // 1. Fetch the ad accounts from TikTok
    const adAccountsData = await this.getAdAccountsFromApi(access_token);
    // 2. Upsert these ad accounts to the database
    return await this.adAccountsRepository.upsert(adAccountsData, account_id, user_id);
  }

  async fetchAdAccountsFromDatabase(fields = ['*'], filters = {}, limit) {
    const results = await this.adAccountsRepository.fetchAdAccounts(fields, filters, limit);
    return results;
  }

}

module.exports = AdAccountService;
