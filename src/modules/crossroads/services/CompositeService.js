const CampaignService = require("./CampaignService");
const InsightsService = require("./InsightsService");
const { CrossroadsLogger } = require("../../../shared/lib/WinstonLogger");

class CompositeService {
  constructor() {
    this.insightsService = new InsightsService();
    this.campaignService = new CampaignService();
  }
  async updateData(account, request_date, saveAggregated=true, saveRawData=false, saveRawDataToFile=false, campaign_id_restrictions=[]) {
    CrossroadsLogger.info(`Starting to sync Crossroads data for date ${request_date}`);
    await this.campaignService.updateCampaigns(account.key);
    await this.insightsService.updateCrossroadsData(account, request_date, saveAggregated, saveRawData, saveRawDataToFile, campaign_id_restrictions);
    CrossroadsLogger.info(`Done syncing Crossroads data for date ${request_date}`);
  }
}

module.exports = CompositeService;
