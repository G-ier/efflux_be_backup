// Local application imports
const AdQueueRepository = require('../repositories/AdQueueRepository');
const BaseService = require('../../../shared/services/BaseService');
const { FacebookLogger } = require('../../../shared/lib/WinstonLogger'); // Replace with your actual logger

class AdQueueService extends BaseService {
  constructor() {
    super(FacebookLogger);
    this.adQueueRepository = new AdQueueRepository();
  }

  async saveToQueueFromLaunch({
    adAccountId,
    existingMedia,
    data,
    campaignId,
    adsetId,
    adId,
    existingLaunchId,
    status,
    existingContentIds,
  }) {
    return await this.adQueueRepository.saveOne({
      existingLaunchId,
      adAccountId,
      existingMedia,
      data,
      campaignId,
      adsetId,
      adId,
      status,
      existingContentIds
    });
  }

  async fetchAdQueueFromDB(fields = ['*'], filters = '{}', limit) {
    // Parse the JSON string to an object
    const filterObject = JSON.parse(filters);

    // Pass the parsed filter object to your repository method
    const results = await this.adQueueRepository.fetchAdQueues(fields, filterObject, limit);
    return results;
  }
}

module.exports = AdQueueService;
