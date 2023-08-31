// Local application imports
const CampaignRepository = require("../repositories/CampaignRepository");
const { TIKTOK_CAMPAIGN_FIELDS_FILTER } = require("../constants");
const { getTikTokEndpointData } = require("../helpers");

class CampaignService {

  constructor() {
    this.campaignRepository = new CampaignRepository();
  }

  async getCampaignsFromAPI(access_token, adAccountIds, date) {
    const additionalParams = {
      fields: TIKTOK_CAMPAIGN_FIELDS_FILTER,
      creation_filter_start_time: date + " 00:00:00"
    };
    return await getTikTokEndpointData("campaign", access_token, adAccountIds, additionalParams);
  }

  async syncCampaigns(access_token, adAccountIds, adAccountsMap, date) {
    const campaigns = await this.getCampaignsFromAPI(access_token, adAccountIds, date);
    await this.campaignRepository.upsert(campaigns, adAccountsMap, 500);
    return campaigns.map((campaign) => campaign.campaign_id);
  }

  async fetchCampaignsFromDatabase(fields = ["*"], filters = {}, limit) {
    const results = await this.campaignRepository.fetchCampaigns(fields, filters, limit);
    return results;
  }
}

module.exports = CampaignService;
