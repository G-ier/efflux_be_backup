const CampaignService = require("./CampaignService");
const InsightsService = require("./InsightsService");

class CompositeService {
  constructor() {
    this.insightsService = new InsightsService();
    this.campaignService = new CampaignService();
  }
  async updateData(account, request_date) {
    await this.campaignService.updateCampaigns(account.key);
    await this.insightsService.updateCrossroadsData(account, request_date);
  }
}

module.exports = CompositeService;
