// Local application imports
const PixelsService = require('../services/PixelsService');

class PixelsController {

  constructor() {
    this.pixelService = new PixelsService();
  }

  async syncPixels(req, res) {
    const { token, adAccountIds, adAccountMap, date } = req.body;
    const updatedAdAccountIds = await this.pixelService.syncPixels(token, adAccountIds, adAccountMap, date);
    res.json(updatedAdAccountIds);
  }

  async fetchPixels(req, res) {
    const { fields, filters, limit } = req.body;
    const pixels = await this.pixelService.fetchPixelsFromDatabase(fields, filters, limit);
    res.json(pixels);
  }

}

module.exports = PixelsController;
