// Third party imports
const { ServiceUnavailable } = require("http-errors");
const axios = require("axios");

// Local application imports
const AdAccountRepository = require("../repositories/AdAccountRepository");
const { FB_API_URL, fieldsFilter } = require("../constants");
const { sendSlackNotification } = require("../../../shared/lib/SlackNotificationService");
class AdAccountService {
  constructor() {
    this.adAccountRepository = new AdAccountRepository();
  }

  async getAdAccountFromApi(adAccountId, token) {
    const url = `${FB_API_URL}act_${adAccountId}?access_token=${token}&fields=${fieldsFilter}`;
    const account = await axios.get(url).catch((err) => {
      throw new ServiceUnavailable(err.response?.data.error || err);
    });
    return account.data;
  }

  async getAdAccountsFromApi(userId, token) {
    const url = `${FB_API_URL}${userId}/adaccounts?fields=${fieldsFilter}&access_token=${token}&limit=10000`;
    const accountsResponse = await axios.get(url).catch(async (err) => {
      console.info("ERROR GETTING FACEBOOK AD ACCOUNTS", err.response?.data.error || err);
      await sendSlackNotification("ERROR FETCHING FACEBOOK AD ACCOUNTS FROM API", err.response?.data.error || err);
      return [];
    });

    if (!accountsResponse) return [];

    return accountsResponse.data?.data;
  }

  async syncAdAccounts(providerId, userId, accountId, token) {
    const apiAdAccounts = await this.getAdAccountsFromApi(providerId, token);
    try {
      await this.adAccountRepository.upsert(apiAdAccounts, userId, accountId, 500);
    } catch (e) {
      console.log("ERROR UPDATING AD ACCOUNTS", e);
      await sendSlackNotification("ERROR UPDATING AD ACCOUNTS. Inspect software if this is a error", e);
      return [];
    }
    return apiAdAccounts.map((account) => account.id);
  }

  async fetchAdAccountsFromDatabase(fields = ["*"], filters = {}, limit) {
    const results = await this.adAccountRepository.fetchAdAccounts(fields, filters, limit);
    return results;
  }
}

module.exports = AdAccountService;
