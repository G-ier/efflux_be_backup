// Standard library imports
const _ = require("lodash");
const FormData = require("form-data");
// Local application imports
const UserAccountService = require("./UserAccountService");
const AdAccountService = require("./AdAccountService");
const PixelsService = require("./PixelsService");
const CampaignsService = require("./CampaignsService");
const AdsetsService = require("./AdsetsService");
const AdInsightsService = require("./AdInsightsService");
const PageService = require("./PageService");
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
    this.pageService = new PageService();
  }

  async syncUserAccountsData(
    account,
    startDate,
    endDate,
    { updatePixels = true, updateCampaigns = true, updateAdsets = true, updateInsights = true },
  ) {
    const { token, name, user_id, id, provider_id } = account;
    FacebookLogger.info(`Syncing data for account ${name}`);

    // Sync Ad Accounts
    const updatedResults = await this.adAccountService.syncAdAccounts(provider_id, user_id, id, token);
    if (!updatedResults.length) throw new Error("No ad accounts to update");
    const adAccounts = await this.adAccountService.fetchAdAccountsFromDatabase(
      ["id", "provider_id", "user_id", "account_id"],
      { account_id: id },
    );
    const updatedAdAccountsDataMap = _(adAccounts).keyBy("provider_id").value();
    const updatedAdAccountIds = Object.keys(updatedAdAccountsDataMap).map((provider_id) => `act_${provider_id}`);

    // Sync Pixels
    if (updatePixels)
      try {
        await this.pixelsService.syncPixels(token, updatedAdAccountIds, updatedAdAccountsDataMap);
      } catch {}

    // Sync Campaigns
    if (updateCampaigns)
      try {
        await this.campaignsService.syncCampaigns(
          token,
          updatedAdAccountIds,
          updatedAdAccountsDataMap,
          startDate,
          endDate,
        );
      } catch {}

    // Sync Adsets
    if (updateAdsets) {
      const campaignIdsObjects = await this.campaignsService.fetchCampaignsFromDatabase(["id"]);
      const campaignIds = campaignIdsObjects.map((campaign) => campaign.id);
      try {
        await this.adsetsService.syncAdsets(
          token,
          updatedAdAccountIds,
          updatedAdAccountsDataMap,
          campaignIds,
          startDate,
          endDate,
        );
      } catch (e) {
        console.log(e);
      }
    }

    // Sync Insights
    if (updateInsights) {
      const adAccounts = await this.adAccountService.fetchAdAccountsFromDatabase(["*"], { account_id: id });
      const adAccountsIds = adAccounts.map(({ provider_id }) => `act_${provider_id}`);
      try {
        await this.adInsightsService.syncAdInsights(token, adAccountsIds, startDate, endDate);
      } catch (e) {
        console.log(e);
      }
    }

    return true;
  }

  async updateFacebookData(
    startDate,
    endDate,
    { updatePixels = true, updateCampaigns = true, updateAdsets = true, updateInsights = true },
  ) {
    FacebookLogger.info(`Starting to sync Facebook data for date range ${startDate} -> ${endDate}`);

    if (!updatePixels && !updateCampaigns && !updateAdsets && !updateInsights)
      throw new Error("No data to update. Please select at least one option");

    // Retrieving account we will use for fetching data
    const accounts = await this.userAccountService.getFetchingAccount();

    for (const account of accounts) {
      await this.syncUserAccountsData(account, startDate, endDate, {
        updatePixels,
        updateCampaigns,
        updateAdsets,
        updateInsights,
      });
    }
    FacebookLogger.info(`Done syncing Facebook data for  date range ${startDate} -> ${endDate}`);
    return true;
  }

  async fetchEntitiesOwnerAccount(entityType, entityId) {

    const entityConfig = {
      adset: {
        service: this.adsetsService.fetchAdsetsFromDatabase.bind(this.adsetsService),
        tableName: "adsets",
      },
      campaign: {
          service: this.campaignsService.fetchCampaignsFromDatabase.bind(this.campaignsService),
          tableName: 'campaigns'
      },
      ad_account: {
          service: this.adAccountService.fetchAdAccountsFromDatabase.bind(this.adAccountService),
          tableName: 'ad_accounts'
      }
    };

    const config = entityConfig[entityType];

    if (!config) {
      throw new Error(`Unsupported entity type: ${entityType}`);
    }

    let result;
    try {
      const whereClause = {
        [`${config.tableName}.${config.tableName === "campaigns" ? "id" : "provider_id"}`]: entityId,
      };
      result = await config.service(["ua.name", "ua.token"], whereClause, 1, [
        {
          type: "inner",
          table: "user_accounts AS ua",
          first: `${config.tableName}.account_id`,
          operator: "=",
          second: "ua.id",
        },
      ]);
    } catch (e) {
      console.log(e);
      await sendSlackNotification(`Error fetching account for entity ${entityType} with id ${entityId}`);
    }

    if (!result.length) {
      throw new Error(`${entityType} with id ${entityId} not found in the database`);
    }

    return result[0];
  }

  async syncPages(businessIds) {

    const admins_only = true;
    const { name, token } = await this.userAccountService.getFetchingAccount(admins_only);
    FacebookLogger.info(`Syncing pages with account ${name}`);
    await this.pageService.syncPages(token, businessIds);

  };

  async updateEntity({ type, entityId, dailyBudget, status }) {
    const account = await this.fetchEntitiesOwnerAccount(type, entityId);
    const { name, token } = account;
    console.log("Fetched Token for account", name);

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
      ...(dailyBudget && { daily_budget: Math.ceil(dailyBudget) }),
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

  async uploadImage(imageBuffer, filename, adAccountId, token) {
    const formData = new FormData();
    formData.append("file", imageBuffer, filename);

    const url = `${FB_API_URL}/act_${adAccountId}/adimages`;

    try {
      const response = await axios.post(url, formData, {
        headers: {
          ...formData.getHeaders(), // form-data module handles the Content-Type multipart/form-data header automatically
          Authorization: `Bearer ${token}`,
        },
      });

      // Depending on the actual structure of the response you might need to adjust the way you access the imageHash
      // const imageHash = response.data.images[0].hash;
      return response.data;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  }

  async checkVideoStatus(videoId, token) {
    const statusUrl = `${FB_API_URL}/${videoId}?fields=status&access_token=${token}`;
    try {
      const response = await axios.get(statusUrl);
      return response.data.status.video_status;
    } catch (error) {
      console.error("Error checking video status:", error);
      throw error;
    }
  }

  async uploadVideo(videoBuffer, filename, adAccountId, token) {
    const formData = new FormData();
    formData.append("file", videoBuffer, filename);

    const url = `${FB_API_URL}/act_${adAccountId}/advideos`;

    try {
      const response = await axios.post(url, formData, {
        headers: {
          ...formData.getHeaders(), // form-data module handles the Content-Type multipart/form-data header automatically
          Authorization: `Bearer ${token}`,
        },
      });
      const videoId = response.data.id;

      // Check video status until it's ready
      let videoStatus = await this.checkVideoStatus(videoId, token);
      while (videoStatus !== "ready") {
        await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait for 30 seconds before checking again
        videoStatus = await this.checkVideoStatus(videoId, token);
      }

      // Depending on the actual structure of the response you might need to adjust the way you access the videoId
      return videoId;
    } catch (error) {
      console.error("Error uploading video:", error);
      throw error;
    }
  }

  async createAd({ token, adAccountId, adData }) {
    const url = `${FB_API_URL}act_${adAccountId}/ads`;
    // Construct the request payload according to the Facebook API specifications
    const payload = {
      ...adData,
      access_token: token, // Assuming the token is passed directly, could be managed differently
    };

    // Dont include the images and videos sent for processing to get hashes and id-s
    delete payload["images"];
    delete payload["videos"];

    try {
      // Make the post request to the Facebook API
      const response = await axios.post(url, payload);

      // Handle the response. Assuming the API returns a JSON with the created ad's ID
      const createdAdId = response.data.id;

      // Return a success response, or the ad ID, depending on what is needed
      return {
        success: true,
        id: createdAdId,
      };
    } catch (error) {
      // Log the error and throw it to be handled by the caller
      FacebookLogger.error(`Error creating ad: ${error.response}`);
      throw error?.response?.data?.error;
    }
  }

}

module.exports = CompositeService;
