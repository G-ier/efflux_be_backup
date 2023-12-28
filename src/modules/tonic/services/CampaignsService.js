// Local application imports
const CampaignsRepository         = require("../repositories/CampaignsRepository");
const TonicBaseService            = require('./TonicBaseService');

class CampaignsService extends TonicBaseService {

  constructor() {
    super();
    this.repository = new CampaignsRepository();
  }

  async fetchCampaigns(fields = ["*"], filters = {}, limit) {
    this.logger.info(`Fetching Tonic Campaigns from the database`);
    const results = await this.repository.fetchCampaigns(fields, filters, limit);
    this.logger.info(`Fetched ${results.length} Tonic Campaigns from the database`);
    return results;
  }

  async fetchCampaignCallback(campaignId) {
    this.logger.info(`Fetching callback for Tonic Campaign ID ${campaignId} from API`);
    const endpoint = `campaign/callback?campaign_id=${campaignId}`;
    const response = await this.makeTonicAPIRequest('GET', endpoint, {}, 'Error fetching campaigns');
    this.logger.info(`Fetched Tonic Campaign Callback for Campaign ID ${campaignId}`);
    return response;
  }

  async fetchCampaignsFromAPI(state) {
    this.logger.info(`Fetching ${state} Tonic Campaigns from the API`);
    const endpoint = `campaign/list?output=json&state=${state}`;
    const response = await this.makeTonicAPIRequest('GET', endpoint, {}, 'Error fetching campaigns');
    this.logger.info(`Fetched ${response.length} ${state} Tonic Campaigns from the API`);
    return response;
  }

  async syncCampaigns() {
    this.logger.info('Syncing Tonic Campaigns');
    const campaigns = await this.fetchCampaignsFromAPI('active');
    this.logger.info(`Upserting ${campaigns.length} Tonic Campaigns`);
    await this.executeWithLogging(
      () => this.repository.upsert(campaigns),
      "Error processing and upserting bulk data"
    );
    this.logger.info('Tonic Campaigns synced successfully');
    return campaigns.length;
  }

}

module.exports = CampaignsService;
