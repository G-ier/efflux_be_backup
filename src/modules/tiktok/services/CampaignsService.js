// Local application imports
const CampaignRepository = require("../repositories/CampaignRepository");
const { TiktokLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");
const { TIKTOK_CAMPAIGN_FIELDS_FILTER } = require("../constants");
const { getTikTokEndpointData } = require("../helpers");

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

  async fetchCampaignsFromDatabase(fields = ["*"], filters = {}, limit) {
    const results = await this.campaignRepository.fetchCampaigns(fields, filters, limit);
    return results;
  }
}

module.exports = CampaignService;
