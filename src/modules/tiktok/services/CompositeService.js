const _ = require("lodash");
const { sendSlackNotification } = require("../../../../services/slackNotificationService");

const CampaignService = require("./CampaignsService");
const AdsetService = require("./AdsetsService");
const AdsService = require("./AdsService");
const AdAccountService = require("./AdAccountsService");
const UserAccountService = require("./UserAccountService");
const AdInsightsService = require("./AdInsightsService");

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
    try {
      const { id, user_id, token } = await this.userAccountsService.getFetchingAccounts();

      const updatedAdAccounts = await this.adAccountService.syncAdAccounts(token, id, user_id);
      console.log("updatedAdAccounts: ", updatedAdAccounts.length);

      // After we update the ad accounts, we need to fetch all the ad accounts from
      // the database to create a map of ad accounts which will be use
      const adAccountsMap = _(await this.adAccountService.fetchAdAccountsFromDatabase(
        ["id", "provider_id", "user_id", "account_id"],
        {provider: "tiktok"}
        )).keyBy("provider_id").value();
      const adAccountIds = Object.keys(adAccountsMap);

      const updatedCampaignIds = await this.campaignService.syncCampaigns(token, adAccountIds, adAccountsMap, date);
      console.log("updatedCampaignIds: ", updatedCampaignIds.length);

      const updatedAdsetsId = await this.adsetService.syncAdsets(token,adAccountIds,adAccountsMap, date);
      console.log("updatedAdsetsId: ", updatedAdsetsId.length);

      const updatedAdsId = await this.adsService.syncAds(token,adAccountIds,adAccountsMap,date);
      console.log("updatedAdsId: ", updatedAdsId.length);

      const updatedAdInsights = await this.adInsightsService.syncAdInsights(token,adAccountIds,adAccountsMap,date);
      console.log("updatedAdInsights: ", updatedAdInsights.length);

      console.log("DONE")
    }
    catch (error) {
      console.error("Error updating tik-tok data in service: ", error);
      await sendSlackNotification("Error updating tik-tok insights: ", error);
      throw error; // propagate the error to be caught in the controller
    }
  }

}

module.exports = CompositeService;
