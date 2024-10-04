// Local application imports
const ScrappedAdsService = require('../services/ScrappedAdsService');

class ScrappedAdsController {

  constructor() {
    this.scrappedAdsService = new ScrappedAdsService();
  }

  async saveScrappedAd(req, res) {
    const { data } = req.body;
    const insertedId = await this.scrappedAdsService.saveScrappedAd(data);
    res.json(insertedId);
  }

  async fetchScrappedAds(req, res) {
    const { fields, filters, limit } = req.query;
    const creatives = await this.scrappedAdsService.fetchScrappedAds(fields, filters, limit);
    res.json(creatives);
  }

  async updateScrappedAd(req, res) {
    const { data } = req.body;
    const { id } = req.params;
    const updatedAdAccountIds = await this.scrappedAdsService.updateScrappedAd(data, id);
    res.json(updatedAdAccountIds);
  }

  async deleteCreative(req, res) {
    const { id } = req.params;
    const numDeleted = await this.scrappedAdsService.deleteById(id);
    res.json(numDeleted);
  }

}

module.exports = ScrappedAdsController;
