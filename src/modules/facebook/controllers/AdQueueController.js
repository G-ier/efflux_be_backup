// Local application imports
const _ = require("lodash")
const AdQueueService = require('../services/AdQueueService');
const {FacebookLogger} = require('../../../shared/lib/WinstonLogger');
const UserAccountService = require('../services/UserAccountService');
const AdAccountService = require('../services/AdAccountService');
const AdLauncherMedia = require("../services/AdLauncherMediaService");

class AdQueueController {

  constructor() {
    this.adQueueService = new AdQueueService();
    this.userAccountService = new UserAccountService()
    this.adAccountService=new AdAccountService()
    this.adLauncherMedia = new AdLauncherMedia();
  }
  getAdAccountId(req) {
    return req.body.adAccountId;
  }
  async sendLaunchToQueue(req, res) {
    try {
      this.validateRequiredParameters(req);
      console.log("ASDASD")
      const token = await this.getToken() ;
      const adAccountId = this.getAdAccountId(req);
      console.log("ASD")
      const firstKey = await this.getFirstKeyFromAdAccounts(adAccountId);
      
      console.log({token,adAccountId,firstKey})


      const { createdMediaObjects } = await this.adLauncherMedia.handleMediaUploads(
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

  validateRequiredParameters(req) {
    const { files, body } = req;
    const { adData, campaignData, adsetData, adAccountId, existingContentIds } = body;

    const missingParameters = [];

    // Check for files only if existingContentIds are not provided or empty
    if (
      (!existingContentIds || existingContentIds.length === 0) &&
      (!files || (!files.video && !files.images))
    ) {
      missingParameters.push('files or existingContentIds');
    }
    if (!adData) {
      missingParameters.push('adData');
    }
    if (!campaignData) {
      missingParameters.push('campaignData');
    }
    if (!adsetData) {
      missingParameters.push('adsetData');
    }
    if (!adAccountId) {
      missingParameters.push('adAccountId');
    }

    if (missingParameters.length > 0) {
      throw new Error(`Missing required parameters: ${missingParameters.join(', ')}`);
    }
  }
  async getToken(adminsOnly = true) {
    return (await this.userAccountService.getFetchingAccount(adminsOnly)).token;
  }
  async getFirstKeyFromAdAccounts(adAccountId) {
    const adAccountsDataMap = await this.getAdAccountsDataMap(adAccountId);
    return Object.keys(adAccountsDataMap)[0];
  }

  async getAdAccountsDataMap(adAccountId) {
    // First try to match using provider_id
    let adAccounts = await this.adAccountService.fetchAdAccountsFromDatabase(
      ['id', 'provider_id', 'user_id', 'account_id'],
      { provider_id: adAccountId },
    );

    // If no accounts found using provider_id, try to match using id
    if (!adAccounts || adAccounts.length === 0) {
      adAccounts = await this.adAccountService.fetchAdAccountsFromDatabase(
        ['id', 'provider_id', 'user_id', 'account_id'],
        { id: adAccountId },
      );
    }

    // Key the results by provider_id for easy lookup later
    return _(adAccounts).keyBy('provider_id').value();
  }


  respondWithError(res, error) {
    // Log any errors encountered during the ad launch process
    FacebookLogger.error(`Error during ad launch: ${error?.error_user_msg || error.message}`, {
      error,
    });
    res.status(500).json({
      success: false,
      message: 'An error occurred while launching the ad.',
      error: error?.error_user_msg || error.message,
    });
  }

  async fetchAdQueue(req, res) {
    const { fields, filters, limit } = req.query;
    const ads = await this.adQueueService.fetchAdQueueFromDB(fields, filters, limit);
    res.json(ads);
  }

}

module.exports = AdQueueController;
