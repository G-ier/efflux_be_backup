
const { TaboolaLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");
const _ = require("lodash");
const { TABOOLA_URL } = require("../constants");

class AdAccountService extends BaseService {

    constructor() {
        super(TiktokLogger);
        //this.adAccountsRepository = new AdAccountsRepository();
    }

    async getAdAccountsFromApi(account_id){
        this.logger.info("Fetching Ad Accounts from API");

        const url = `${TABOOLA_URL}/api/1.0/${account_id}/advertisers`;

        const data = await this.fetchFromApi(url, {}, "Error fetching advertiser accounts", {});

        if (data.metadata.total === 0) throw new Error("Error getting ad accounts");
        this.logger.info(`Fetched ${data.metadata.total} Ad Accounts from API`)

        return data.results;
    }

    async syncAdAccounts(account_id, user_id){
        const adAccountsData = await this.getAdAccountsFromApi(account_id);
        this.logger.info(`Upserting ${adAccountsData.length} Ad Accounts`);
        const results = await this.executeWithLogging(
            () => this.adAccountsRepository.upsert(adAccountsData, account_id, user_id),
            "Error Upserting Ad Account"
          )
          this.logger.info(`Done upserting ad accounts`);
          return results
    }
}