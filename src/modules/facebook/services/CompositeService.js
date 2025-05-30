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
const detectMediaNetPurchaseEvents = require("../../../shared/reports/detectMediaNetPurchaseEvents")
const { FacebookLogger, CapiLogger } = require("../../../shared/lib/WinstonLogger");
const { sendSlackNotification } = require("../../../shared/lib/SlackNotificationService");
const { validateInput } = require("../helpers");
const { FB_API_URL } = require("../constants");
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");


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
    this.database = new DatabaseRepository();
  }

  async syncUserAccountsData(
    account,
    startDate,
    endDate,
    { updateCampaigns = true, updateAdsets = true, updateInsights = true },
  ) {
    const { token, name, user_id, id, provider_id } = account;
    FacebookLogger.info(`Syncing data for account ${name}`);

    // Sync Ad Accounts
    const updatedResults = await this.adAccountService.syncAdAccounts(provider_id, user_id, id, token);
    if (!updatedResults.length) throw new Error("No ad accounts to update");

    // Fetch ad acounts belonging to the user account
    const adAccounts = await this.adAccountService.fetchAdAccountsFromDatabase(
      ["ad_accounts.id", "ad_accounts.provider_id"],
      { "map.ua_id": id },
      false,
      [
        {
          type: "inner",
          table: "ua_aa_map AS map",
          first: "ad_accounts.id",
          operator: "=",
          second: "map.aa_id",
        },
      ],
    );
    const updatedAdAccountsDataMap = _(adAccounts).keyBy("provider_id").value();
    const updatedAdAccountIds = Object.keys(updatedAdAccountsDataMap).map((provider_id) => `act_${provider_id}`);

    // Sync Campaigns
    if (updateCampaigns) {
      try {
        await this.campaignsService.syncCampaigns(
          token,
          updatedAdAccountIds,
          updatedAdAccountsDataMap,
          startDate,
          endDate,
        );
      } catch {}
    }

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
      try {
        await this.adInsightsService.syncAdInsights(token, updatedAdAccountIds, startDate, endDate);
      } catch (e) {
        console.log(e);
      }
    }

    return true;
  }

  async updateFacebookData(
    startDate,
    endDate,
    { updateCampaigns = true, updateAdsets = true, updateInsights = true },
  ) {
    FacebookLogger.info(`Starting to sync Facebook data for date range ${startDate} -> ${endDate}`);

    if (!updateCampaigns && !updateAdsets && !updateInsights)
      throw new Error("No data to update. Please select at least one option");

    // Retrieving account we will use for fetching data
    const accounts = await this.userAccountService.getFetchingAccount();

    for (const account of accounts) {
      await this.syncUserAccountsData(account, startDate, endDate, {
        updateCampaigns,
        updateAdsets,
        updateInsights,
      });
    }
    FacebookLogger.info(`Done syncing Facebook data for  date range ${startDate} -> ${endDate}`);
    return true;
  }

  async fetchEntitiesOwnerByAdAccounts(entityId) {
    const result = await this.database.raw(
      `
      select
          ua.name,
          ua.token
      from "ad_accounts"
      inner join ua_aa_map as map on ad_accounts.id = map.aa_id
      inner join user_accounts as ua on map.ua_id = ua.id
      where "ad_accounts"."id" = ${entityId};
      `
    )
    return result.rows[0];
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
        [`${config.tableName}.${config.tableName === "campaigns" || config.tableName === "ad_accounts" ? "id" : config.tableName === 'fb_pixels' ? "pixel_id" : "provider_id"}`]: entityId,
      };

      const joins = [
        {
          type: "inner",
          table: "aa_prioritized_ua_map AS map",
          first: `${config.tableName}.${config.tableName !== 'ad_accounts' ? 'ad_account_id' : 'id' }`,
          operator: "=",
          second: "map.aa_id",
        },
        {
          type: "inner",
          table: "user_accounts AS ua",
          first: `map.ua_id`,
          operator: "=",
          second: "ua.id",
        },
      ]

      result = await config.service(["ua.name", "ua.token"], whereClause, 1, joins);
    } catch (e) {
      console.log(e);
      await sendSlackNotification(`Error fetching account for entity ${entityType} with id ${entityId}`);
    }

    if (!result.length) {
      throw new Error(`${entityType} with id ${entityId} not found in the database`);
    }

    return result[0];
  }

  async syncPixels() {
    const accounts = await this.userAccountService.getFetchingAccount()
    const adAccounts = await this.adAccountService.fetchAdAccountsFromDatabase(
      ["map.ua_id", "ad_accounts.id", "ad_accounts.provider_id"],
      { "ad_accounts.provider": "facebook" },
      false,
      [
        {
          type: "inner",
          table: "ua_aa_map AS map",
          first: "ad_accounts.id",
          operator: "=",
          second: "map.aa_id",
        },
      ]
    );
    for (const account of accounts) {

      const { token, name, id } = account;
      FacebookLogger.info(`Syncing pixels for account ${name}`);
      const accountAdAccounts = adAccounts.filter((adAccount) => adAccount.ua_id === id);
      const adAccountIds = accountAdAccounts.map((adAccount) => `act_${adAccount['provider_id']}`);

      try {
        await this.pixelsService.syncPixels(token, adAccountIds);
      } catch (error) {
        console.log(error);
      }
    }
    FacebookLogger.info(`Done syncing pixels`);
  }

  async syncPages() {

    const accounts = await this.userAccountService.getFetchingAccount()

    // Construct an account for each business id.
    const systemUsers = accounts.filter(account => account.role === 'system_user')
    await this.pageService.syncPages(systemUsers, true);

    // Sync pages for users
    const clientAccounts = accounts.filter(account => account.role === 'profile')
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

      console.log("UPDATE DATA", updateData);

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

      console.log("RESPONSE", response.data);
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
    else if (network === 'media-net') {
      data = await detectMediaNetPurchaseEvents(this.capiService.database, date, 'facebook');
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
        for(const payload of batch.payloads) {
          await this.capiService.postCapiEvents(token, batch.entityId, payload);
        }
    }
    CapiLogger.info(`DONE Posting events to FB CAPI in batches.`);

    const updatedCount = await this.capiService.updateReportedEvents(eventIds, network);
    CapiLogger.info(`Reported ${updatedCount} session to Facebook CAPI for network ${network}`);
  }

}

module.exports = CompositeService;
