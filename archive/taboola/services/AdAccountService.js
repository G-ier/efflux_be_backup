
// Local applications import
const AdAccountRepository = require("../repositories/AdAccountRepository");
const { TaboolaLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");
const _ = require("lodash");
const { TABOOLA_URL } = require("../constants");

class AdAccountService extends BaseService {

    constructor() {
        super(TaboolaLogger);
        this.adAccountsRepository = new AdAccountRepository();
    }

    async getAdAccountsFromApi(account_id, token){
        this.logger.info("Fetching Ad Accounts from API");

        const url = `${TABOOLA_URL}/api/1.0/${account_id}/advertisers`;
        const header = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
        const data = await this.fetchFromApi(url, {}, "Error fetching advertiser accounts", header);

        if (data.metadata.total === 0) throw new Error("Error getting ad accounts");
        this.logger.info(`Fetched ${data.metadata.total} Ad Accounts from API`)

        return data.results;
    }

    async syncAdAccounts(account_id, token, user_id, user_account_id){
        const adAccountsData = await this.getAdAccountsFromApi(account_id, token);
        this.logger.info(`Upserting ${adAccountsData.length} Ad Accounts`);
        const results = await this.executeWithLogging(
            () => this.adAccountsRepository.upsertAdAccounts(adAccountsData),
            "Error Upserting Ad Account"
          )
        this.logger.info(`Done upserting ad accounts`);

        const providerIds = adAccountsData.map((account) => account.account_id);
        const idsList = await this.adAccountsRepository.fetchAdAccounts(["id"], { provider_id: providerIds });
        const ids = idsList.map((id) => id.id);

        this.logger.info(`Upserting User Account & User Ad Account Association`)
        // Update The Map between Ad Accounts and User Accounts
        await this.executeWithLogging(
          () => this.adAccountsRepository.upsertUserAccountsAssociation(ids, user_account_id, 500),
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

    async fetchAdAccountsFromDatabase(fields = ["*"], filters = {}, limit, joins = []) {
        const results = await this.adAccountsRepository.fetchAdAccounts(fields, filters, limit, joins);
        return results;
    }
}

module.exports = AdAccountService;
