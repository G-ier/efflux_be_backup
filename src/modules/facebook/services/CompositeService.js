// Standard library imports
const _ = require("lodash");

// Local application imports
const UserAccountService = require("./UserAccountService");
const AdAccountService = require("./AdAccountService");
const PixelsService = require("./PixelsService");
const CampaignsService = require("./CampaignsService");
const AdsetsService = require("./AdsetsService");
const AdInsightsService = require("./AdInsightsService");
const { FacebookLogger } = require("../../../shared/lib/WinstonLogger");
const { sendSlackNotification } = require("../../../shared/lib/SlackNotificationService");

const { validateInput } = require("../helpers");
const { FB_API_URL } = require("../constants");
const axios = require("axios");
class CompositeService {

  constructor() {
    this.userAccountService = new UserAccountService();
    this.adAccountService = new AdAccountService();
    this.pixelsService = new PixelsService();
    this.campaignsService = new CampaignsService();
    this.adsetsService = new AdsetsService();
    this.adInsightsService = new AdInsightsService();
  }

  async updateFacebookData(date, {
    updatePixels = true,
    updateCampaigns = true,
    updateAdsets = true,
    updateInsights = true,
  }) {

    FacebookLogger.info(`Starting to sync Facebook data for date ${date}`);

    if (!updatePixels && !updateCampaigns && !updateAdsets && !updateInsights)
      throw new Error("No data to update. Please select at least one option");

    // Retrieving account we will use for fetching data
    const accounts = await this.userAccountService.getFetchingAccount();

    for (const account of accounts) {

      const { token, name, user_id, id, provider_id } = account;

      FacebookLogger.info(`Syncing data for account ${name}`);

      // Sync Ad Accounts
      const updatedResults = await this.adAccountService.syncAdAccounts(provider_id, user_id, id, token);
      if (!updatedResults.length) throw new Error("No ad accounts to update");
      const adAccounts = await this.adAccountService.fetchAdAccountsFromDatabase(["id", "provider_id", "user_id", "account_id"], { account_id: id });
      const updatedAdAccountsDataMap = _(adAccounts).keyBy("provider_id").value();
      const updatedAdAccountIds = Object.keys(updatedAdAccountsDataMap).map((provider_id) => `act_${provider_id}`);

      // Sync Pixels
      if (updatePixels)
        try { await this.pixelsService.syncPixels(token, updatedAdAccountIds, updatedAdAccountsDataMap)}
        catch {}

      // Sync Campaigns
      if (updateCampaigns)
        try { await this.campaignsService.syncCampaigns(token, updatedAdAccountIds, updatedAdAccountsDataMap, date)}
        catch {}

      // Sync Adsets
      if (updateAdsets) {
        const campaignIdsObjects = await this.campaignsService.fetchCampaignsFromDatabase(["id"]);
        const campaignIds = campaignIdsObjects.map((campaign) => campaign.id);
        try {await this.adsetsService.syncAdsets(token, updatedAdAccountIds, updatedAdAccountsDataMap, campaignIds, date)}
        catch (e) {console.log(e)}
      }

      // Sync Insights
      if (updateInsights) {
        const adAccounts = await this.adAccountService.fetchAdAccountsFromDatabase(["*"], { account_id: id });
        const adAccountsIds = adAccounts.map(({ provider_id }) => `act_${provider_id}`);
        try {await this.adInsightsService.syncAdInsights(token, adAccountsIds, date)}
        catch (e) {console.log(e)}
      }
    }
    FacebookLogger.info(`Done syncing Facebook data for date ${date}`);
    return true;
  }

  async updateEntity({ type, entityId, dailyBudget, status }) {

    let account;
    try {
      const admins_only = true;
      account = await this.userAccountService.getFetchingAccount(admins_only);
    } catch (e) {
      console.log("No account to fetch data from facebook", e);
      await sendSlackNotification("No account to get token from to update entity. Inspect software if this is a error");
      return false;
    }
    const { token } = account;

    async function updateDatabase(type, entityId, dailyBudget, status) {

      const updateData = {
        ...(status && { status }),
        ...(dailyBudget && { daily_budget: dailyBudget }),
      };

      if (type === "adset") {
        await this.adsetsService.updateAdset(updateData, { provider_id: entityId });
      } else {
        await this.campaignsService.updateCampaign(updateData, { id: entityId });
        if (status) {
          await this.adsetsService.updateAdset({ status }, { campaign_id: entityId });
        }
      }
    }

    validateInput({ type, token, status });
    const url = `${FB_API_URL}${entityId}`;
    const params = {
      access_token: token,
      ...(status && { status }),
      ...(dailyBudget && { daily_budget: Math.ceil(dailyBudget)}),
    };

    try {
      const response = await axios.post(url, params);
      if (response.data?.success) {
        await updateDatabase.call(this, type, entityId, dailyBudget, status);
      }
      return response.data?.success ?? false;
    } catch ({ response }) {
      console.log(response.data);
      return false;
    }
  }

  async duplicateEntity({ type, deep_copy, status_option, rename_options, entity_id }) {
    let account;
    try {
      const admins_only = true;
      account = await this.userAccountService.getFetchingAccount(admins_only);
    } catch (e) {
      console.log("No account to fetch data from facebook", e);
      await sendSlackNotification("No account to fetch data from facebook. Inspect software if this is a error");
      return false;
    }
    const { token } = account;

    if (type === "campaign") {
      const duplicated = await this.campaignsService.duplicateCampaign({
        deep_copy,
        status_option,
        rename_options,
        entity_id,
        access_token: token,
      });
      return duplicated;
    }
    if (type === "adset") {
      const duplicated = await this.adsetsService.duplicateAdset({
        deep_copy,
        status_option,
        rename_options,
        entity_id,
        access_token: token,
        campaign_id: null,
      });
      return duplicated;
    }
  }

}

module.exports = CompositeService;
