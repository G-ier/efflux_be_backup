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
    this.logger = TiktokLogger
  }

  async updateTikTokData(date, endDate = null, adAccountIdsLimitation = null, uCampaigns = true, uAdsets = true, uAds = true, uInsights = true) {

    if(endDate){
      this.logger.info(`Starting to sync TikTok data for daterange ${date} - ${endDate}`);
    }
    else{
      this.logger.info(`Starting to sync TikTok data for date ${date}`);
    }

    //Retrieving account we will use for fetching data
    const { id, user_id, token } = await this.userAccountsService.getFetchingAccounts();

    // Sync ad accounts
    await this.adAccountService.syncAdAccounts(token, id, user_id);
    const adAccounts = await this.adAccountService.fetchAdAccountsFromDatabase(["id", "provider_id", "user_id", "account_id"], {provider: "tiktok"});
    const adAccountsMap = _(adAccounts).keyBy("provider_id").value();
    const adAccountIds = adAccountIdsLimitation ? adAccountIdsLimitation : Object.keys(adAccountsMap);


    // Sync campaigns
    if(uCampaigns) await this.campaignService.syncCampaigns(token, adAccountIds, adAccountsMap, date, endDate);

    // Sync adsets
    const campaignIdsObjects = await this.campaignService.fetchCampaignsFromDatabase(["id", "ad_account_id"], {traffic_source: "tiktok"});
    if(uAdsets){
    const campaignIds = campaignIdsObjects.map((campaign) => campaign.id);
    await this.adsetService.syncAdsets(token, adAccountIds, adAccountsMap, campaignIds, date, endDate);
    }

    // Sync ads
    if (uAds) await this.adsService.syncAds(token,adAccountIds,adAccountsMap,date, endDate);

    // Sync ad insights
    if (uInsights){
    const campaignIdsMap = _(campaignIdsObjects).keyBy("id").value();
    await this.adInsightsService.syncAdInsights(token, adAccountIds, campaignIdsMap, date, endDate);
    }

    if(endDate){
      this.logger.info(`Done syncing TikTok data for daterange ${date} - ${endDate}`);
    }
    else{
      this.logger.info(`Done syncing TikTok data for date ${date}`);
    }
  }

  async updateEntity({ type, entityId, dailyBudget, status }) {
    try {
        this.logger.info(`Starting update for entity of type ${type} with ID: ${entityId}`);

        const { token } = await this.userAccountsService.getFetchingAccounts();
        this.logger.debug('Fetched user accounts information');

        let service;
        let ad_account_id;

        if (type === 'adset' || type === 'campaign') {
          service = type === 'adset' ? this.adsetService : this.campaignService;
          const fetchMethod = type === 'adset' ? 'fetchAdsetsFromDatabase' : 'fetchCampaignsFromDatabase';
          ad_account_id = await service[fetchMethod](["ad_account_id"], {id: entityId});
      } else {
          throw new Error('Invalid type specified');
      }
        this.logger.debug(`Determined service and fetched ad account ID for entity ID ${entityId}`);

        const { provider_id } = await this.adAccountService.fetchAdAccountDetails(ad_account_id[0].ad_account_id,"tiktok");
        const updateResponse = await this.updateServiceEntity({
            service,
            entityId,
            dailyBudget,
            status,
            type,
            advertiser_id: provider_id,
            token,
            entityName: ad_account_id[0].name
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
}

module.exports = CompositeService;
