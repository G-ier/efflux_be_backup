// Local application imports
const AdQueueRepository = require("../repositories/AdQueueRepository");
const BaseService = require("../../../shared/services/BaseService");
const { FacebookLogger } = require("../../../shared/lib/WinstonLogger"); // Replace with your actual logger

class AdQueueService extends BaseService {
  constructor() {
    super(FacebookLogger);
    this.adQueueRepository = new AdQueueRepository();
  }

  async fetchAdQueueFromDB(fields = ['*'], filters = {}, limit) {
    const results = await this.adQueueRepository.fetchAdQueues(fields, filters, limit);
    return results;
  }

}

module.exports = AdQueueService;
