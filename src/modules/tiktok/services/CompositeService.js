const _ = require("lodash");

const CampaignService = require("./CampaignsService");
const AdsetService = require("./AdsetsService");
const AdsService = require("./AdsService");
const AdAccountService = require("./AdAccountsService");
const UserAccountService = require("./UserAccountService");
const AdInsightsService = require("./AdInsightsService");
const { TiktokLogger } = require("../../../shared/lib/WinstonLogger");

class CompositeService {

  constructor() {
    this.userAccountsService = new UserAccountService();
    this.campaignService = new CampaignService();
    this.adsetService = new AdsetService();
    this.adsService = new AdsService();
    this.adAccountService = new AdAccountService();
    this.adInsightsService = new AdInsightsService();
  }

  async updateTikTokData(date) {

    TiktokLogger.info(`Starting to sync TikTok data for date ${date}`);

    // Retrieving account we will use for fetching data
    const { id, user_id, token } = await this.userAccountsService.getFetchingAccounts();

    // Sync ad accounts
    await this.adAccountService.syncAdAccounts(token, id, user_id);
    const adAccounts = await this.adAccountService.fetchAdAccountsFromDatabase(["id", "provider_id", "user_id", "account_id"], {provider: "tiktok"});
    const adAccountsMap = _(adAccounts).keyBy("provider_id").value();
    const adAccountIds = Object.keys(adAccountsMap);

    // Sync campaigns
    await this.campaignService.syncCampaigns(token, adAccountIds, adAccountsMap, date);

    // Sync adsets
    const campaignIdsObjects = await this.campaignService.fetchCampaignsFromDatabase(["id"]);
    const campaignIds = campaignIdsObjects.map((campaign) => campaign.id);
    await this.adsetService.syncAdsets(token, adAccountIds, adAccountsMap, campaignIds, date);

    // Sync ads
    await this.adsService.syncAds(token,adAccountIds,adAccountsMap,date);

    // Sync ad insights
    await this.adInsightsService.syncAdInsights(token, adAccountIds, adAccountsMap, date);

    TiktokLogger.info(`Done syncing TikTok data for date ${date}`);
  }

}

module.exports = CompositeService;
