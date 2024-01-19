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

    const adAccounts = [];
    let paging = {};
    let url = `${FB_API_URL}${userId}/adaccounts`;
    let params = {
      fields: fieldsFilter,
      access_token: token,
      limit: 50,
    };

    do {
      if (paging?.next) {
        url = paging.next;
        params = {};
      }

      const data = await this.fetchFromApi(
        url,
        params,
        "Error fetching Ad Accounts from API"
      );
      paging = { ...data?.paging };
      if (data?.data?.length) adAccounts.push(...data.data);
    } while (paging?.next);

    this.logger.info(`Fetched ${adAccounts.length} Ad Accounts from API`)
    return adAccounts;
  }

  async syncAdAccounts(providerId, userId, accountId, token) {

    const apiAdAccounts = await this.getAdAccountsFromApi(providerId, token);

    this.logger.info(`Upserting ${apiAdAccounts.length} Ad Accounts`);
    // Upsert Ad Accounts
    await this.executeWithLogging(
      () => this.adAccountRepository.upsertAdAccounts(apiAdAccounts, 500),
      "Error Upserting Ad Account"
    )
    this.logger.info(`Done upserting ad accounts`)

    const providerIds = apiAdAccounts.map((account) => account.account_id);
    const idsList = await this.adAccountRepository.fetchAdAccounts(["id"], { provider_id: providerIds });
    const ids = idsList.map((id) => id.id);

    this.logger.info(`Upserting User Account & User Ad Account Association`)
    // Update The Map between Ad Accounts and User Accounts
    await this.executeWithLogging(
      () => this.adAccountRepository.upsertUserAccountsAssociation(ids, accountId, 500),
      "Error Upserting User Account Ad Account Association"
    )
    // Update the map between Ad Accounts and Users
    await this.executeWithLogging(
      () => this.adAccountRepository.upsertUserAssociation(ids, userId, 500),
      "Error Upserting User Ad Account Association"
    )
    this.logger.info(`Done upserting User Account & User Ad Account Association`)

    return apiAdAccounts.map((account) => account.id);
  }

  async fetchAdAccountsFromDatabase(fields = ["*"], filters = {}, limit, joins = []) {
    const results = await this.adAccountRepository.fetchAdAccounts(fields, filters, limit, joins);
    return results;
  }

  async fetchAdAccountsMapFromDatabase() {
    const results = await this.adAccountRepository.fetchAdAccountsUserAccountMap(
      ['ua_aa_map.id', 'ua_aa_map.ua_id', 'ua_aa_map.aa_id', 'ua.name AS ua_name', 'aa.name AS aa_name', 'prio.ua_id as prioritised_acc'],
      {},
      false,
      [
        {
          type: "inner",
          table: "ad_accounts AS aa",
          first: `ua_aa_map.aa_id`,
          operator: "=",
          second: "aa.id",
        },
        {
          type: "inner",
          table: "user_accounts AS ua",
          first: `ua_aa_map.ua_id`,
          operator: "=",
          second: "ua.id",
        },
        {
          type: "inner",
          table: "aa_prioritized_ua_map AS prio",
          first: `ua_aa_map.aa_id`,
          operator: "=",
          second: "prio.aa_id",
        }
      ]
      );
    return results;
  }

  async updatePrioritiesMap(updateData, criterion) {
    const updateCount = await this.adAccountRepository.updatePrioritiesMap(updateData, criterion);
    return updateCount
  }

  async updateAdAccountInDatabase(updateData, id) {
    const updateCount = await this.adAccountRepository.update(updateData, id);
    return updateCount
  }

}

module.exports = AdAccountService;
