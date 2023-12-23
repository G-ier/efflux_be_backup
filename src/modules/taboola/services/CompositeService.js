// Standard library imports
const _ = require("lodash");

// Local application imports
const UserAccountService = require("./UserAccountService");
const AdAccountService = require("./AdAccountService");
const ConversionRuleService = require("./ConversionRuleService");
const CampaignService = require("./CampaignService");
const AdService = require("./AdService");
const InsightService = require("./InsightService");
const S2SService = require("./S2SService");
const { TaboolaLogger, CapiLogger } = require("../../../shared/lib/WinstonLogger");
const detectCrossroadsPurchaseEvents = require("../../../shared/reports/detectCrossroadsPurchaseEvents");

class CompositeService {

    constructor() {
        this.userAccountService = new UserAccountService();
        this.adAccountService = new AdAccountService();
        this.campaignService = new CampaignService();
        this.adService = new AdService();
        this.insightService = new InsightService();
        this.s2SService = new S2SService();
        this.conversionRuleService = new ConversionRuleService();
    }

    async syncUserAccountsData(start_date, end_date){
        const { access_token, expires_in } = await this.userAccountService.getTaboolaAdvertiserTokenFromClient();
        await this.userAccountService.syncTaboolaNetworkAccount(access_token, expires_in);
        const { id, name, provider_id, user_id } = await this.userAccountService.getFetchingAccount();
        TaboolaLogger.info(`Syncing data for account ${name}`);

        //Sync Ad Accounts
        await this.adAccountService.syncAdAccounts(provider_id, access_token, user_id, id);
        const adAccounts = await this.adAccountService.fetchAdAccountsFromDatabase(
            ["id", "provider_id", "user_id", "account_id"],
            { account_id: id },
          );
        const updatedAdAccountsDataMap = _(adAccounts).keyBy("provider_id").value();
        const updatedAdAccountsIds = _.map(adAccounts, "provider_id");
        if (!adAccounts.length) throw new Error("No ad accounts to update");
        // //const conversionRules = await this.conversionRuleService.syncConversionRules(updatedAdAccountsIds, access_token);

        // Sync Campaigns
        const campaigns = await this.campaignService.syncCampaigns(access_token, updatedAdAccountsIds, updatedAdAccountsDataMap);

        // Sync Insights
        await this.insightService.syncInsights(updatedAdAccountsIds, access_token,
          start_date, end_date);

        // Sync Ads
        await this.adService.syncAds(access_token, campaigns, updatedAdAccountsDataMap);

        return true;
    }

    async sendS2SEvents(date) {
        // Retrieve the data
        CapiLogger.info(`Fetching session from DB.`);
        // To be replaced
        const data = await detectCrossroadsPurchaseEvents(this.capiService.database, date, 'taboola');
        if (data.length === 0) {
        CapiLogger.info(`No events found for date ${date}.`);
        return;
        }
        CapiLogger.info(`Done fetching ${data.length} session from DB.`);

        const tblProcessedPayloads = await this.s2SService.constructTaboolaS2SPayload(data);

        CapiLogger.info(`Posting events to FB CAPI in batches.`);
        for(const batch of tblProcessedPayloads){
          const { account } = await this.fetchEntitiesOwnerAccount(batch.entityType, batch.entityId);
            for(const payload of batch.payloads){
              const jsonPayload = JSON.stringify(payload);
              await this.s2SService.postS2SEvents(account, jsonPayload);
            }
        }
        CapiLogger.info(`DONE Posting events to FB CAPI in batches.`);

    }
}

module.exports = CompositeService;
