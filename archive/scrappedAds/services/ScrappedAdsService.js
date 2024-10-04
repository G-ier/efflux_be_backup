// Third party imports
const {} = require("http-errors");

// Local application imports
const ScrappedAdsRepository = require('../repositories/ScrappedAdsRepository');

class ScrappedAdsService {

  constructor() {
    this.scrappedAdsRepository = new ScrappedAdsRepository();
  }

  async saveScrappedAd(scrappedAd) {
    return await this.scrappedAdsRepository.saveOne(scrappedAd);
  }

  async saveScrappedAds(scrappedAds) {
    return await this.scrappedAdsRepository.saveInBulk(scrappedAds);
  }

  async fetchScrappedAds(fields = ['*'], filters = {}, limit) {
    const results = await this.scrappedAdsRepository.fetchScrappedAds(fields, filters, limit);
    return results;
  }

  async updateScrappedAd(scrappedAd, scrappedAdId) {
    return await this.scrappedAdsRepository.updateOne(scrappedAd, scrappedAdId);
  }

  async deleteById(scrappedAdId) {
    return await this.scrappedAdsRepository.deleteById(scrappedAdId);
  }
}

module.exports = ScrappedAdsService;
