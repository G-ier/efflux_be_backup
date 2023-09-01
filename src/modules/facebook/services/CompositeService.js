// Standard library imports
const _ = require('lodash');

// Local application imports
const UserAccountService = require('./UserAccountService');
const AdAccountService = require('./AdAccountService');
const PixelsService = require('./PixelsService');
const CampaignsService = require('./CampaignsService');
const AdsetsService = require('./AdsetsService');
const AdInsightsService = require('./AdInsightsService');
const { sendSlackNotification } = require('../../../shared/lib/SlackNotificationService');

class CompositeService {

  constructor() {
    this.userAccountService = new UserAccountService();
    this.adAccountService = new AdAccountService();
    this.pixelsService = new PixelsService();
    this.campaignsService = new CampaignsService();
    this.adsetsService = new AdsetsService();
    this.adInsightsService = new AdInsightsService();
  }

  async updateFacebookData(date) {

    // Function stops as is if there is no account to fetch data from fb if we don't have a token
    let account;
    try{
      account = await this.userAccountService.getFetchingAccount();
    } catch (e) {
      console.log("No account to fetch data from facebook", e);
      await sendSlackNotification("No account to fetch data from facebook. Inspect software if this is a error");
      return false;
    }
    const { token, user_id, id, provider_id } = account;

    // Even if we fail to retrieve the account, we wont fetch pixels, campaigns, adsets and insights
    const updatedAdAccountIds = await this.adAccountService.syncAdAccounts(provider_id, user_id, id, token);
    if (!updatedAdAccountIds.length) {
      console.log("No ad accounts to update");
      await sendSlackNotification("No ad accounts to update in facebook. Inspect if this is a error");
      return false;
    }
    const updatedAdAccountsDataMap = _(await this.adAccountService.fetchAdAccountsFromDatabase(
      ['id', 'provider_id', 'user_id', 'account_id'],
      { provider_id: updatedAdAccountIds.map((id) => id.replace("act_", "")) }
    )).keyBy('provider_id').value();
    console.log("Done with updating ad accounts", updatedAdAccountIds.length);

    const updatedPixelIds = await this.pixelsService.syncPixels(
      token,
      updatedAdAccountIds,
      updatedAdAccountsDataMap
    )
    console.log("Done with updating pixels", updatedPixelIds.length);

    const updatedCampaignIds = await this.campaignsService.syncCampaigns(
      token,
      updatedAdAccountIds,
      updatedAdAccountsDataMap
    )
    console.log("Done with updating campaigns", updatedCampaignIds.length);

    const campaignIdsObjects = await this.campaignsService.fetchCampaignsFromDatabase(['id'])
    const campaignIds = campaignIdsObjects.map((campaign) => campaign.id);
    const updatedAdsetIds = await this.adsetsService.syncAdsets(
      token,
      updatedAdAccountIds,
      updatedAdAccountsDataMap,
      campaignIds
    )
    console.log("Done with updating adsets", updatedAdsetIds.length);

    const adAccounts = await this.adAccountService.fetchAdAccountsFromDatabase(
      ["id", "name", "status", "provider", "provider_id", "network", "tz_name", "tz_offset"],
      {account_id: id}
    );
    const adAccountsIds = adAccounts.map(({ provider_id }) => `act_${provider_id}`);
    const insights = await this.adInsightsService.syncAdInsights(
      token,
      adAccountsIds,
      date
    );
    console.log("Done with updating insights", insights.length)

    console.log("Done with updating all facebook data")
    return true;
  }

}

module.exports = CompositeService;
