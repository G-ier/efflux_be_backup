// Local application imports
const AdsetsService = require('../services/AdsetsService');

class AdsetsController {

  constructor() {
    this.adsetsService = new AdsetsService();
  }

  async syncAdsets(req, res) {
    const { token, adAccountIds, adAccountsMap, campaignIds, startDate, endDate, preset } = req.body;
    const adsetIds = await this.adsetsService.syncAdsets(token, adAccountIds, adAccountsMap, campaignIds, startDate, endDate, preset);
    res.json(adsetIds);
  }

  async fetchAdsets(req, res) {
    const { fields, filters, limit } = req.body;
    const adsets = await this.adsetsService.fetchAdsetsFromDatabase(fields, filters, limit);
    res.json(adsets);
  }

}

module.exports = AdsetsController;
