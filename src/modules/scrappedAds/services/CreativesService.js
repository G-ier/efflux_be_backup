// Third party imports
const {} = require("http-errors");

// Local application imports
const CreativesRepository = require('../repositories/CreativesRepository');

class CreativesService {

  constructor() {
    this.creativesRepository = new CreativesRepository();
  }

  async saveCreative(creative) {
    return await this.creativesRepository.saveOne(creative);
  }

  async saveCreatives(creatives) {
    return await this.creativesRepository.saveInBulk(creatives);
  }

  async fetchCreatives(fields = ['*'], filters = {}, limit) {
    const results = await this.creativesRepository.fetchCreatives(fields, filters, limit);
    return results;
  }

  async updateCreative(creative, creativeId) {
    return await this.creativesRepository.updateOne(creative, creativeId);
  }

  async deleteById(adCardId) {
    return await this.creativesRepository.deleteById(adCardId);
  }
}

module.exports = CreativesService;
