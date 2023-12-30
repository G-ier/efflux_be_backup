// Third party imports
const axios = require("axios");

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
const CapiService = require("./CapiService");
const newDetectCrossroadsPurchaseEvents = require("../../../shared/reports/newDetectCrossroadsPurchaseEvents")
const detectTonicPurchaseEvents = require("../../../shared/reports/detectTonicPurchaseEvents")
const { FacebookLogger, CapiLogger } = require("../../../shared/lib/WinstonLogger");
const { sendSlackNotification } = require("../../../shared/lib/SlackNotificationService");
const { validateInput } = require("../helpers");
const { FB_API_URL } = require("../constants");

class CompositeService {

  constructor() {
    this.userAccountService = new UserAccountService();
    this.adAccountService = new AdAccountService();
    this.pixelsService = new PixelsService();
    this.campaignsService = new CampaignsService();
    this.adsetsService = new AdsetsService();
    this.adInsightsService = new AdInsightsService();
    this.pageService = new PageService();
    this.capiService = new CapiService();
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
      },
      pixel: {
        service: this.pixelsService.fetchPixelsFromDatabase.bind(this.pixelsService),
        tableName: 'fb_pixels'
      }
    };

    const config = entityConfig[entityType];

    if (!config) {
      throw new Error(`Unsupported entity type: ${entityType}`);
    }

    let result;
    try {
      const whereClause = {
        [`${config.tableName}.${config.tableName === "campaigns" ? "id" : config.tableName === 'fb_pixels' ? "pixel_id" : "provider_id"}`]: entityId,
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

    const accounts = await this.userAccountService.getFetchingAccount()

    // Construct an account for each business id.
    const businessAdminAccount = accounts.filter(account => account.business)[0]
    const businessAdminAccounts = businessIds.map(businessId => {
      return {
        ...businessAdminAccount,
        businessId
      }
    })
    // Sync business pages
    await this.pageService.syncPages(businessAdminAccounts, true);

    // Sync pages for users
    const clientAccounts = accounts.filter(account => !account.business)
    await this.pageService.syncPages(clientAccounts, false);

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

  async routeConversions(conversion, network='crossroads') {
    // Fetch pixels from database
    const pixels = await this.pixelsService.fetchPixelsFromDatabase(['pixel_id']);

    // Filter Data. We don't update broken events here. The event is in the DynamoDB table.
    const {brokenPixelEvents, validPixelEvents} = await this.capiService.parseBrokenPixelEvents([conversion], pixels);

    // If no valid events, return
    if (validPixelEvents.length === 0) {
      CapiLogger.info(`Conversion with id: ${conversion.id} didn't have a valid pixel value`);
      return;
    }

    // Construct facebook conversion payloads
    const { fbProcessedPayloads, eventIds } = await this.capiService.constructFacebookCAPIPayload(validPixelEvents);

    // Post events to FB CAPI
    CapiLogger.info(`Posting events to FB CAPI in batches.`);
    for(const batch of fbProcessedPayloads){

      const { token } = await this.fetchEntitiesOwnerAccount(batch.entityType, batch.entityId);

        for(const payload of batch.payloads) {
          await this.capiService.postCapiEvents(token, batch.entityId, payload);
        }
    }
    CapiLogger.info(`Reported to Facebook CAPI for network ${network}`);
  }

  async sendCapiEvents(date, network='crossroads') {

    // Retrieve the data
    CapiLogger.info(`Fetching session from DB.`);
    let data = [];

    if (network === 'crossroads') {
      data = await newDetectCrossroadsPurchaseEvents(this.capiService.database, date, 'facebook');
    }
    else if (network === 'tonic') {
      data = await detectTonicPurchaseEvents(this.capiService.database, date, 'facebook');
    }
    if (data.length === 0) {
      CapiLogger.info(`No events found for date ${date}.`);
      return;
    }
    CapiLogger.info(`Done fetching ${data.length} session from DB.`);

    // Fetch pixels from database
    const pixels = await this.pixelsService.fetchPixelsFromDatabase(['pixel_id']);

    // Filter Data
    const {brokenPixelEvents, validPixelEvents} = await this.capiService.parseBrokenPixelEvents(data, pixels);

    // Flag incorrect Data
    await this.capiService.updateInvalidEvents(brokenPixelEvents, network);

    // If no valid events, return
    if (validPixelEvents.length === 0) {
      CapiLogger.info(`No valid sessions found for date ${date}.`);
      return;
    }

    const { fbProcessedPayloads, eventIds } = await this.capiService.constructFacebookCAPIPayload(validPixelEvents);

    CapiLogger.info(`Posting events to FB CAPI in batches.`);
    for(const batch of fbProcessedPayloads){
      const { token } = await this.fetchEntitiesOwnerAccount(batch.entityType, batch.entityId);
        for(const payload of batch.payloads){
          await this.capiService.postCapiEvents(token, batch.entityId, payload);
        }
    }
    CapiLogger.info(`DONE Posting events to FB CAPI in batches.`);

    const updatedCount = await this.capiService.updateReportedEvents(eventIds, network);
    CapiLogger.info(`Reported ${updatedCount} session to Facebook CAPI for network ${network}`);
  }

}

module.exports = CompositeService;
