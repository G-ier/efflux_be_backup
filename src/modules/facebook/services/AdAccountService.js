// Third party imports
const { ServiceUnavailable } = require("http-errors");
const axios = require("axios");

// Local application imports
const AdAccountRepository = require("../repositories/AdAccountRepository");
const { FB_API_URL, fieldsFilter } = require("../constants");
const { FacebookLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");
class AdAccountService extends BaseService {

  constructor() {
    super(FacebookLogger);
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
    this.logger.info("Fetching Ad Accounts from API");

    const data = await this.fetchFromApi(
      `${FB_API_URL}${userId}/adaccounts`,
        {fields: fieldsFilter, access_token: token, limit: 10000 },
      "Error fetching Ad Accounts from API"
    );
    this.logger.info(`Fetched ${data?.data?.length} Ad Accounts from API`)
    return data?.data;
  }

  async syncAdAccounts(providerId, userId, accountId, token) {
    const apiAdAccounts = await this.getAdAccountsFromApi(providerId, token);
    this.logger.info(`Upserting ${apiAdAccounts.length} Ad Accounts`);
    await this.executeWithLogging(
      () => this.adAccountRepository.upsert(apiAdAccounts, userId, accountId, 500),
      "Error Upserting Ad Account"
    )
    this.logger.info(`Done upserting ad accounts`);
    return apiAdAccounts.map((account) => account.id);
  }

  async fetchAdAccountsFromDatabase(fields = ["*"], filters = {}, limit, joins = []) {
    const results = await this.adAccountRepository.fetchAdAccounts(fields, filters, limit, joins);
    return results;
  }

  async updateAdAccountInDatabase(updateData, id) {
    const updateCount = await this.adAccountRepository.update(updateData, id);
    return updateCount
  }

}

module.exports = AdAccountService;
