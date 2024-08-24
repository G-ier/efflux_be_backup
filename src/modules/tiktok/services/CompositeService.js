const _ = require("lodash");

const CampaignService = require("./CampaignsService");
const AdsetService = require("./AdsetsService");
const AdsService = require("./AdsService");
const AdAccountService = require("./AdAccountsService");
const UserAccountService = require("./UserAccountService");
const AdInsightsService = require("./AdInsightsService");
const PixelService = require("./PixelsService")
const EventsApiService = require("./EventsApiService")
const { TiktokLogger, CapiLogger } = require("../../../shared/lib/WinstonLogger");
const detectCrossroadsPurchaseEvents = require("../../../shared/reports/detectCrossroadsPurchaseEvents")
const { validateInput } = require("../helpers");

class CompositeService {

  constructor() {
    this.userAccountsService = new UserAccountService();
    this.campaignService = new CampaignService();
    this.adsetService = new AdsetService();
    this.adsService = new AdsService();
    this.adAccountService = new AdAccountService();
    this.adInsightsService = new AdInsightsService();
    this.pixelService = new PixelService();
    this.capiService = new EventsApiService();
    this.logger = TiktokLogger
  }

  async fetchEntitiesOwnerAccount(entityType, entityId) {

    const entityConfig = {
      adset: {
        service: this.adsetService.fetchAdsetsFromDatabase.bind(this.adsetService),
        tableName: "adsets",
      },
      campaign: {
          service: this.campaignService.fetchCampaignsFromDatabase.bind(this.campaignService),
          tableName: 'campaigns'
      },
      ad_account: {
          service: this.adAccountService.fetchAdAccountsFromDatabase.bind(this.adAccountService),
          tableName: 'ad_accounts'
      },
      pixel: {
        service: this.pixelService.fetchPixelsFromDatabase.bind(this.pixelService),
        tableName: 'tt_pixels'
      }
    };

    const config = entityConfig[entityType];

    if (!config) {
      throw new Error(`Unsupported entity type: ${entityType}`);
    }

    let result;
    try {
      const whereClause = {
        [`${config.tableName}.${config.tableName === "campaigns" || config.tableName === "ad_accounts" ? "id" : config.tableName === 'tt_pixels' ? "code" : "provider_id"}`]: entityId,
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
        }
      ];
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

  async syncUserAccountData(account, date, endDate = null, adAccountIdsLimitation = null, uPixels=true, uCampaigns = true, uAdsets = true, uAds = true, uInsights = true) {

    //Retrieving account we will use for fetching data
    const { token, name, user_id, id } = account;
    this.logger.info(`Syncing data for account ${name}`);

    // Sync ad accounts
    await this.adAccountService.syncAdAccounts(token, id, user_id);

    // Change the query to the new pattern.
    const adAccounts = await this.adAccountService.fetchAdAccountsFromDatabase(
      ["ad_accounts.id", "ad_accounts.provider_id"],
      {"map.ua_id": id},
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
    const adAccountsMap = _(adAccounts).keyBy("provider_id").value();
    const adAccountIds = adAccountIdsLimitation ? adAccountIdsLimitation : Object.keys(adAccountsMap);

    // Sync pixels
    if(uPixels) {
      try {
        await this.pixelService.syncPixels(token, adAccountIds, adAccountsMap)
      }
      catch (e) {this.logger.error(`Error syncing pixels for account ${name}: ${e.message}`)}
    }

    // Sync campaigns
    if(uCampaigns) {
      try {
        try {await this.campaignService.syncCampaigns(token, adAccountIds, adAccountsMap, date, endDate)}
        catch (e) {this.logger.error(`Error syncing campaigns for account ${name}: ${e.message}`)}
      } catch (e) {
        this.logger.error(`Error syncing campaigns for account ${name}: ${e.message}`);
      }
    }

    // Sync adsets
    const campaignIdsObjects = await this.campaignService.fetchCampaignsFromDatabase(["id", "ad_account_id"], {traffic_source: "tiktok"});
    if(uAdsets){
      const campaignIds = campaignIdsObjects.map((campaign) => campaign.id);
      try {
        await this.adsetService.syncAdsets(token, adAccountIds, adAccountsMap, campaignIds, date, endDate);
      } catch (e) {
        this.logger.error(`Error syncing adsets for account ${name}: ${e.message}`);
      }
    }

    // Sync ads
    if (uAds) {
      try {
        await this.adsService.syncAds(token,adAccountIds,adAccountsMap, date, endDate)
      }
      catch (e) {this.logger.error(`Error syncing ads for account ${name}: ${e.message}`)}
    }

    // Sync ad insights
    if (uInsights){
      const campaignIdsMap = _(campaignIdsObjects).keyBy("id").value();
      try {
        await this.adInsightsService.syncAdInsights(token, adAccountIds, campaignIdsMap, date, endDate);
      } catch (e) {
        this.logger.error(`Error syncing ad insights for account ${name}: ${e.message}`);
      }
    }

    return true;
  }

  async updateTikTokData(date, endDate = null, adAccountIdsLimitation = null, uPixels=true, uCampaigns = true, uAdsets = true, uAds = true, uInsights = true) {

    if (endDate)
      this.logger.info(`Starting to sync Tiktok data for date range ${date} -> ${endDate}`);
    else
      this.logger.info(`Starting to sync Tiktok data for date ${date}`);

    if (!uPixels && !uCampaigns && !uAdsets && !uAds &&!uInsights)
      throw new Error("No data to update. Please select at least one option");

    //Retrieving account we will use for fetching data
    const accounts = await this.userAccountsService.getFetchingAccounts();

    for (const account of accounts) {
      await this.syncUserAccountData(account, date, endDate, adAccountIdsLimitation, uPixels, uCampaigns, uAdsets, uAds, uInsights);
    }
    if(endDate)
      this.logger.info(`Done syncing TikTok data for daterange ${date} - ${endDate}`);
    else
      this.logger.info(`Done syncing TikTok data for date ${date}`);
    return true;
  }

  async updateEntity({ type, entityId, dailyBudget, status }) {

    console.log({ type, entityId, dailyBudget, status});

    try {
        const { name: userName, token } = await this.fetchEntitiesOwnerAccount(type, entityId);
        console.log("Fetched Token for account", userName);

        validateInput({ type, token, status });

        const entitiesConfig = {
            adset: {
              tableName: "adsets",
              service: this.adsetService,
              fetch: this.adsetService.fetchAdsetsFromDatabase.bind(this.adsetService),
            },
            campaign: {
              tableName: "campaigns",
              service: this.campaignService,
              fetch: this.campaignService.fetchCampaignsFromDatabase.bind(this.campaignService),
            },
        }

        const config = entitiesConfig[type];
        const fields = [`${config.tableName}.name`, `aa.provider_id`];
        const filter = {};
        filter[`${config.tableName}.id`] = entityId;
        const joins = [
          {
            type: "inner",
            table: "ad_accounts AS aa",
            first: "aa.id",
            operator: "=",
            second: `${config.tableName}.ad_account_id`,
          }
        ]
        const adAccount = await config.fetch(fields, filter, 1, joins);
        const { name: entityName, provider_id } = adAccount[0];

        const updateResponse = await this.updateServiceEntity({
            service: config.service,
            entityId,
            dailyBudget,
            status,
            type,
            advertiser_id: provider_id,
            token,
            entityName: entityName
        });
        const { statusResponse, budgetResponse } = updateResponse.tikTokResponse;

        // Check statusResponse separately
        if (statusResponse) {
          if (statusResponse.code !== 0) {
              const errorMessage = `Status update error: ${statusResponse.message}`;
              this.logger.error(errorMessage);
              throw new Error(errorMessage);
          }
        }

        // Check budgetResponse separately
        if (budgetResponse) {
          if (budgetResponse.code !== 0) {
              const errorMessage = `Budget update error: ${budgetResponse.message}`;
              this.logger.error(errorMessage);
              throw new Error(errorMessage);
          }
        }

        if (type === 'campaign' && status !== undefined && (statusResponse && statusResponse.code === 0)) {
          await this.adsetService.updateAdsetsForCampaign(entityId, status, token,provider_id);
            this.logger.info(`Successfully updated adsets for campaign ID ${entityId}`);
        }

        return true;

    } catch (error) {
        this.logger.error(`Error updating entity of type ${type} with ID ${entityId}: ${error.message}`);
        throw error;
    }
  }

  async updateServiceEntity({ service, entityId, dailyBudget, status, type, advertiser_id, token, entityName }) {
      this.logger.info(`Updating entity of type ${type} with ID ${entityId}`);
      const updateResponse = await service.updateEntity({
          entityId,
          dailyBudget,
          status,
          type,
          advertiser_id,
          token,
          entityName
      });
      this.logger.info(`Successfully updated entity of type ${type} with ID ${entityId}`);
      return updateResponse;
  }

  async sendCapiEvents(date) {

    // Retrieve the data
    CapiLogger.info(`Fetching sessions from DB.`);
    const data = await detectCrossroadsPurchaseEvents(this.capiService.database, date, 'tiktok');
    if (data.length === 0) {
      CapiLogger.info(`No sessions found for date ${date}.`);
      return;
    }
    CapiLogger.info(`Done fetching ${data.length} sessions from DB.`);

    // Fetch pixels from database
    const pixels = await this.pixelService.fetchPixelsFromDatabase(['code']);

    // Filter Data
    const { brokenPixelEvents, validPixelEvents } = this.capiService.parseBrokenPixelEvents(data, pixels);

    // Flag incorrect Data
    await this.capiService.updateInvalidEvents(brokenPixelEvents);

    // If no valid events, return
    if (validPixelEvents.length === 0) {
      CapiLogger.info(`No valid sessions found for date ${date}.`);
      return;
    }

    const { ttProcessedPayloads, eventIds } = await this.capiService.constructTiktokCAPIPayload(validPixelEvents);

    CapiLogger.info(`Posting events to TT CAPI in batches.`);
    for (const batch of ttProcessedPayloads) {
      const { token } = await this.userAccountsService.fetchEntitiesOwnerAccount('pixel', batch.entityId);
      const pixelId = batch.entityId;

      for( const payload of batch.payloads ){
        await this.capiService.postCapiEvents(token, pixelId, payload);
      }
    }
    CapiLogger.info(`Done posting events to TT CAPI in batches.`);

    await this.capiService.updateReportedEvents(eventIds);
  }

}

module.exports = CompositeService;
