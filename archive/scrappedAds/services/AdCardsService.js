// Third party imports
const {} = require("http-errors");

// Local application imports
const AdCardsRepository = require('../repositories/AdCardsRepository');

class AdCardsService {

  constructor() {
    this.adCardsRepository = new AdCardsRepository();
  }

  async saveAdCard(adCard) {
    return await this.adCardsRepository.saveOne(adCard);
  }

  async saveAdCards(adCards) {
    return await this.adCardsRepository.saveInBulk(adCards);
  }

  async fetchAdCards(fields = ['*'], filters = {}, limit) {
    const results = await this.adCardsRepository.fetchAdCards(fields, filters, limit);
    return results;
  }

  async updateAdCard(adCard) {
    return await this.adCardsRepository.updateOne(adCard);
  }

  async deleteById(adCardId) {
    return await this.adCardsRepository.deleteById(adCardId);
  }
}

module.exports = AdCardsService;
