// Local application imports
const CampaignRepository = require("../repositories/CampaignRepository");
const { TiktokLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");
const { TIKTOK_CAMPAIGN_FIELDS_FILTER } = require("../constants");
const { getTikTokEndpointData, updateTikTokEntity, statusMapping } = require("../helpers");

class CampaignService extends BaseService {

  constructor() {
    super(TiktokLogger);
    this.campaignRepository = new CampaignRepository();
  }

  async getCampaignsFromAPI(access_token, adAccountIds, date) {
    this.logger.info("Fetching Campaigns from API");
    const additionalParams = {
      fields: TIKTOK_CAMPAIGN_FIELDS_FILTER,
      creation_filter_start_time: date + " 00:00:00"
    };
    return await getTikTokEndpointData("campaign", access_token, adAccountIds, additionalParams);
  }

  async syncCampaigns(access_token, adAccountIds, adAccountsMap, date) {
    const campaigns = await this.getCampaignsFromAPI(access_token, adAccountIds, date);
    this.logger.info(`Upserting ${campaigns.length} Campaigns`);
    await this.campaignRepository.upsert(campaigns, adAccountsMap, 500);
    this.logger.info(`Done upserting campaigns`);
    return campaigns.map((campaign) => campaign.campaign_id);
  }

  async updateEntity({entityId, dailyBudget, status, advertiser_id, token, name}) {
    try {
      this.logger.info(`Starting update for entity ID: ${entityId}`);  // Log the start of the update operation
      // Dynamically construct criteria based on provided values
      const criteria = {};
      if (dailyBudget !== undefined) {
        criteria.dailyBudget = dailyBudget / 100;
        criteria.budget = dailyBudget / 100;
      }
      if (status !== undefined) {
        criteria.status = statusMapping[status];
      }

      this.logger.debug(`Update criteria for entity ID ${entityId}: ${JSON.stringify(criteria)}`);  // Log the update criteria

      // Ensure at least one criterion has been provided
      if (Object.keys(criteria).length === 0) {
        this.logger.error('No update criteria provided');  // Log an error if no criteria are provided
        throw new Error('No update criteria provided');
      }
      
      // Call updateTikTokEntity with the necessary arguments
      this.logger.info(`Updating TikTok entity for ID ${entityId}`);  // Log the start of the TikTok update
      const tikTokResponse = await updateTikTokEntity({
        advertiser_id,
        type: 'campaign',  // type is set to 'campaign' as this is the CampaignService
        access_token: token,
        updateParams: criteria,
        entityId,
        entityName: name
      });

      this.logger.info(`Successfully updated TikTok entity for ID ${entityId}`);  // Log the success of the TikTok update

      // After successfully updating the TikTok entity, update the local entity in your database
      this.logger.info(`Updating local entity for ID ${entityId}`);  // Log the start of the local update
      const localUpdateResponse = await this.campaignRepository.updateOne(criteria, {id: entityId});
      this.logger.info(`Successfully updated local entity for ID ${entityId}`);  // Log the success of the local update

      return {
        tikTokResponse,
        localUpdateResponse
      };
    } catch (error) {
      this.logger.error(`ERROR UPDATING ENTITY ID ${entityId}`, error);  // Utilizing the logger with more context
      throw error;
    }
  }

  async fetchCampaignsFromDatabase(fields = ["*"], filters = {}, limit) {
    const results = await this.campaignRepository.fetchCampaigns(fields, filters, limit);
    return results;
  }
}

module.exports = CampaignService;
