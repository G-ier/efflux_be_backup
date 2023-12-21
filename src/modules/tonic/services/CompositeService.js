const CampaignsService = require("./CampaignsService");
const InsightsService = require("./InsightsService");
const { TonicLogger } = require("../../../shared/lib/WinstonLogger");

class CompositeService {
  constructor() {
    this.insightsService = new InsightsService();
    this.campaignService = new CampaignsService();
  }
  async updateData(startDate, endDate, hour, final=false) {
    TonicLogger.info(`Starting to sync Tonic data for date ${startDate} - ${endDate}`);
    await this.campaignService.syncCampaigns();
    await this.insightsService.syncInsights(startDate, endDate, hour, final);
    TonicLogger.info(`Done syncing Tonic data for date ${startDate} - ${endDate}`);
  }
}

module.exports = CompositeService;
