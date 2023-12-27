
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
            () => this.adAccountsRepository.upsert(adAccountsData, user_id, user_account_id),
            "Error Upserting Ad Account"
          )
          this.logger.info(`Done upserting ad accounts`);
          return results
    }

    async fetchAdAccountsFromDatabase(fields = ["*"], filters = {}, limit, joins = []) {
        const results = await this.adAccountsRepository.fetchAdAccounts(fields, filters, limit, joins);
        return results;
    }
}

module.exports = AdAccountService;
