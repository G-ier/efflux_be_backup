// Local application imports
const AdQueueService = require('../services/AdQueueService');

class AdQueueController {

  constructor() {
    this.adQueueService = new AdQueueService();
  }

  async fetchAdQueue(req, res) {
    const { fields, filters, limit } = req.body;
    const pages = await this.adQueueService.fetchAdQueueFromDB(fields, filters, limit);
    res.json(pages);
  }

}

module.exports = AdQueueController;
