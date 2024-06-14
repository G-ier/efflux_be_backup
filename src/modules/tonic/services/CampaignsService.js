// Local application imports
const AccountsRepository = require("../repositories/AccountsRepository");
const CampaignsRepository         = require("../repositories/CampaignsRepository");
const TonicBaseService            = require('./TonicBaseService');

class CampaignsService extends TonicBaseService {

  constructor() {
    super();
    this.repository = new CampaignsRepository();
    this.accounts_repo = new AccountsRepository();
  }

  async getCampaignsAccount(campaignId) {
    return await this.repository.fetchCampaignsAccount(campaignId);
  }

  async fetchCampaigns(fields = ["*"], filters = {}, limit) {
    this.logger.info(`Fetching Tonic Campaigns from the database`);
    const results = await this.repository.fetchCampaigns(fields, filters, limit);
    this.logger.info(`Fetched ${results.length} Tonic Campaigns from the database`);
    return results;
  }

  /*
    Fetches only active domains for the ad launcher destination domain
  */
  async fetch_active_domains(account_id){
    this.logger.info(`Fetching Tonic Active Domains from the database`);
    const account = await this.accounts_repo.fetchAccount(account_id);

    const endpoint = `/privileged/v3/campaign/list?output=json&state=active`;
    //const response = await this.makeTonicAPIRequest(account, 'GET', endpoint, {}, 'Error fetching campaigns');
    const response = await this.makeTonicAPIRequest(account, 'GET', endpoint, {}, 'Error fetching campaigns').catch(error => {
      console.log(error);
    });
    return response;
  }

  async fetchCampaignCallback(campaignId) {
    this.logger.info(`Fetching callback for Tonic Campaign ID ${campaignId} from API`);
    const endpoint = `campaign/callback?campaign_id=${campaignId}`;
    const account = await this.repository.fetchCampaignsAccount(campaignId);
    const response = await this.makeTonicAPIRequest(account, 'GET', endpoint, {}, 'Error fetching campaigns');
    this.logger.info(`Fetched Tonic Campaign Callback for Campaign ID ${campaignId}`);
    return response;
  }

  async fetchCampaignsFromAPI(account, state) {
    this.logger.info(`Fetching ${state} Tonic Campaigns from the API`);
    const endpoint = `campaign/list?output=json&state=${state}`;
    const response = await this.makeTonicAPIRequest(account, 'GET', endpoint, {}, 'Error fetching campaigns');
    this.logger.info(`Fetched ${response.length} ${state} Tonic Campaigns from the API`);
    return response;
  }

  async syncCampaigns(account) {
    this.logger.info(`Syncing Tonic Campaigns for account ${account.email}`);
    const campaigns = await this.fetchCampaignsFromAPI(account, 'active');
    this.logger.info(`Upserting ${campaigns.length} Tonic Campaigns`);
    await this.executeWithLogging(
      () => this.repository.upsert(campaigns, account.id),
      "Error processing and upserting bulk data"
    );
    this.logger.info('Tonic Campaigns synced successfully');
    return campaigns.length;
  }

}

module.exports = CampaignsService;
