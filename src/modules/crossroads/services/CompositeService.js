const CampaignService = require("./CampaignService");
const InsightsService = require("./InsightsService");
const { CrossroadsLogger } = require("../../../shared/lib/WinstonLogger");

class CompositeService {
  constructor() {
    this.insightsService = new InsightsService();
    this.campaignService = new CampaignService();
  }
  async updateData(account, request_date) {
    CrossroadsLogger.info(`Starting to sync Crossroads data for date ${request_date}`);
    await this.campaignService.updateCampaigns(account.key);
    await this.insightsService.updateCrossroadsData(account, request_date);
    CrossroadsLogger.info(`Done syncing Crossroads data for date ${request_date}`);
  }
}

module.exports = CompositeService;
