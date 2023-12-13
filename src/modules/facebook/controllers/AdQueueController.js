// Local application imports
const AdQueueService = require('../services/AdQueueService');

class AdQueueController {

  constructor() {
    this.adQueueService = new AdQueueService();
  }
  
  async sendLaunchToQueue(req, res) {
    try {
      this.validateRequiredParameters(req);
      const token = await this.getToken() ;
      const adAccountId = this.getAdAccountId(req);
      const firstKey = await this.getFirstKeyFromAdAccounts(adAccountId);

      const { createdMediaObjects } = await this.contentService.handleMediaUploads(
        req,
        firstKey,
        token,
        req.body.existingContentIds,
      );

      await this.adQueueService.saveToQueueFromLaunch({
        adAccountId: firstKey,
        existingMedia: createdMediaObjects,
        data: req.body,
      });


      const adCreationResult = { id: adQueueId, ...adQueueData };

      res.json({
        success: true,
        message: 'Ad successfully sent to queue.',
        data: adCreationResult,
      });
    } catch (error) {
      FacebookLogger.error(`Error during Ad Launch: ${error.message}`);
      this.respondWithError(res, error);
    }
  }

  async launchFromQueue(req, res) {
    
  }


  async getFirstKeyFromAdAccounts(adAccountId) {
    const adAccountsDataMap = await this.getAdAccountsDataMap(adAccountId);
    return Object.keys(adAccountsDataMap)[0];
  }

  async fetchAdQueue(req, res) {
    const { fields, filters, limit } = req.query;
    const ads = await this.adQueueService.fetchAdQueueFromDB(fields, filters, limit);
    res.json(ads);
  }

}

module.exports = AdQueueController;
