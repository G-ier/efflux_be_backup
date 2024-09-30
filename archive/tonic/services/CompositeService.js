const CampaignsService        = require("./CampaignsService");
const InsightsService         = require("./InsightsService");
const AccountService          = require("./AccountService");
const PixelService            = require("./PixelService");
const { TonicLogger }         = require("../../../shared/lib/WinstonLogger");

class CompositeService {

  constructor() {
    this.insightsService        = new InsightsService();
    this.campaignService        = new CampaignsService();
    this.accountService         = new AccountService();
    this.pixelService           = new PixelService();
  }

  async updateData(startDate, endDate, hour, final=false) {
    TonicLogger.info(`Starting to sync Tonic data for date ${startDate} - ${endDate}`);

    const accounts = await this.accountService.fetchTonicAccounts();
    for (const account of accounts) {
      TonicLogger.info(`Syncing data for account ${account.email}`);
      await this.campaignService.syncCampaigns(account);
      await this.insightsService.syncInsights(account, startDate, endDate, hour, final);
      TonicLogger.info(`Done syncing Tonic data for date ${startDate} - ${endDate}`);
    }
  }

  async getCampaignPixle(campaignId) {
    const campaignsAccount = await this.campaignService.getCampaignsAccount(campaignId);
    if (!campaignsAccount || campaignsAccount.length === 0) {
      TonicLogger.info(`No account found for campaign ${campaignId} or the campaign id is invalid`);
      return [];
    }
    const pixel = await this.pixelService.getPixels(campaignsAccount, campaignId);
    return pixel;
  }

  async invokeCampaignsPixel(campaignId) {
    const campaignsAccount = await this.campaignService.getCampaignsAccount(campaignId);
    if (!campaignsAccount || campaignsAccount.length === 0) {
      TonicLogger.info(`No account found for campaign ${campaignId} or the campaign id is invalid`);
      return [];
    }
    const response = await this.pixelService.invokePixel(campaignsAccount, campaignId);
    return response;
  }

  async createTrafficSourcePixel(trafficSource, campaignId, eventName, pixelId, accessToken) {
    const campaignsAccount = await this.campaignService.getCampaignsAccount(campaignId);
    if (!campaignsAccount || campaignsAccount.length === 0) {
      TonicLogger.info(`No account found for campaign ${campaignId} or the campaign id is invalid`);
      return [];
    }
    const response = await this.pixelService.createTrafficSourcePixel(campaignsAccount, trafficSource, campaignId, eventName, pixelId, accessToken);
    return response;
  }

}

module.exports = CompositeService;
