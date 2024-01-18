const CampaignService = require("./CampaignService");
const InsightsService = require("./InsightsService");
const { CrossroadsLogger } = require("../../../shared/lib/WinstonLogger");

class CompositeService {
  constructor() {
    this.insightsService = new InsightsService();
    this.campaignService = new CampaignService();
  }
  async updateData(accounts, request_date, saveRawDataToFile=false) {

    for(const account of accounts) {
      CrossroadsLogger.info(`Starting to sync Crossroads data for date ${request_date} and ${account.id}`);
      await this.campaignService.updateCampaigns(account.key);
      await this.insightsService.updateCrossroadsData(account, request_date, saveRawDataToFile);
    }
    CrossroadsLogger.info(`Done syncing Crossroads data for date ${request_date}`);
  }
  
}

module.exports = CompositeService;
