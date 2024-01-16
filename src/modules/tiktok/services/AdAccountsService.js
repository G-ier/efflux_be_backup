const axios = require("axios");
const {
  TIKTOK_API_URL,
  TIKTOK_APP_ID,
  TIKTOK_APP_SECRET,
  TIKTOK_AD_ACCOUNT_AVAILABLE_FIELDS,
} = require("../constants");
const { TiktokLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");
const _ = require("lodash");
const AdAccountsRepository = require("../repositories/AdAccountRepository");

class AdAccountService extends BaseService {

  constructor() {
    super(TiktokLogger);
    this.adAccountsRepository = new AdAccountsRepository();
  }

  async getAdAccountDataFromApi(access_token, adAccountIds) {
    this.logger.info("Fetching Ad Accounts Data from API");
    const availableFields = TIKTOK_AD_ACCOUNT_AVAILABLE_FIELDS; // You'd need to import TIKTOK_AD_ACCOUNT_AVAILABLE_FIELDS at the top.
    const endpoint = "advertiser/info";
    const url = `${TIKTOK_API_URL}/${endpoint}`;
    const params = { advertiser_ids: JSON.stringify(adAccountIds), fields: JSON.stringify(availableFields)}
    const headers = { "Access-Token": access_token };

    let data = { data: { list: [] } };
    try {
      data = await this.fetchFromApi(
        url,
        params,
        "Error fetching ad acccounts from API",
        headers
      )
    } catch (error) {
      this.logger.error(`Error fetching ad account data from API: ${error}`);
      return [];
    }

    return data.data.list;
  }

  async getAdAccountsFromApi(access_token) {
    this.logger.info("Fetching Ad Accounts from API");
    const endpoint = "oauth2/advertiser/get";
    const url = `${TIKTOK_API_URL}/${endpoint}`;
    const headers = { "Access-Token": access_token};
    const params = { app_id: TIKTOK_APP_ID, secret: TIKTOK_APP_SECRET}

    const data = await this.fetchFromApi(
      url,
      params,
      "Error fetching ad acccounts from API",
      headers
    )

    if (data.code !== 0) throw new Error("Error getting ad accounts");

    this.logger.info(`Fetched ${data.data.list.length} Ad Accounts from API`)
    const adAccountsIds = data.data.list.map(({ advertiser_id }) => advertiser_id);
    const dataChunks = _.chunk(adAccountsIds, 100);
    const adAccountsData = [];
    for (const chunk of dataChunks) {
      let adAccountsDataIter = await this.getAdAccountDataFromApi(access_token, chunk);
      adAccountsData.push(...adAccountsDataIter);
    }
    return adAccountsData;
  }

  async syncAdAccounts(access_token, account_id, user_id) {
    const adAccountsData = await this.getAdAccountsFromApi(access_token);
    this.logger.info(`Upserting ${adAccountsData.length} Ad Accounts`);
    const results = await this.executeWithLogging(
      () => this.adAccountsRepository.upsertAdAccounts(adAccountsData),
      "Error Upserting Ad Account"
    )
    this.logger.info(`Done upserting ad accounts`);

    const providerIds = adAccountsData.map((account) => account.advertiser_id);
    const idsList = await this.adAccountsRepository.fetchAdAccounts(["id"], { provider_id: providerIds });
    const ids = idsList.map((id) => id.id);

    this.logger.info(`Upserting User Account & User Ad Account Association`)
    // Update The Map between Ad Accounts and User Accounts
    await this.executeWithLogging(
      () => this.adAccountsRepository.upsertUserAccountsAssociation(ids, account_id, 500),
      "Error Upserting User Account Ad Account Association"
    )
    // Update the map between Ad Accounts and Users
    await this.executeWithLogging(
      () => this.adAccountsRepository.upsertUserAssociation(ids, user_id, 500),
      "Error Upserting User Ad Account Association"
    )
    this.logger.info(`Done upserting User Account & User Ad Account Association`)

    return results
  }

  async fetchAdAccountDetails(ad_account_id) {
    const adAccount = await this.fetchAdAccountsFromDatabase(
        ["id", "provider_id"],
        { id: ad_account_id}
    );
    this.logger.debug('Fetched ad account details');
    return adAccount[0];
  }

  async fetchAdAccountsFromDatabase(fields = ['*'], filters = {}, limit, joins=[]) {
    const results = await this.adAccountsRepository.fetchAdAccounts(fields, filters, limit, joins);
    return results;
  }

}

module.exports = AdAccountService;
