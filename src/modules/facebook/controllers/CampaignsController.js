// Local application imports
const CampaignsService = require('../services/CampaignsService');

class CampaignsController {

  constructor() {
    this.campaignService = new CampaignsService();
  }

  async syncCampaigns(req, res) {
    const { token, adAccountIds, adAccountsMap, date } = req.body;
    const campaignIds = await this.campaignService.syncCampaigns(token, adAccountIds, adAccountsMap, date);
    res.json(campaignIds);
  }

  async fetchCampaigns(req, res) {
    const { fields, filters, limit } = req.body;
    const campaigns = await this.campaignService.fetchCampaignsFromDatabase(fields, filters, limit);
    res.json(campaigns);
  }

}

module.exports = CampaignsController;
