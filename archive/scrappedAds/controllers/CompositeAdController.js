const CompositeAdService = require("../services/CompositeAdService");

class CompositeAdController {

  constructor() {
    this.compositeAdService = new CompositeAdService();
  }

  async saveCompositeAdData(req, res) {
    const { data } = req.body;
    const result = await this.compositeAdService.createCompositeAd(data.adCard, data.creative, data.scrappedAd);
    res.json(result);
  }

  async updateCompositeAdData(req, res) {
    const { data } = req.body;
    const { id } = req.params;
    const result = await this.compositeAdService.updateCompositeAd(data, id);
    res.json(result);
  }

  async getCompositeAdData(req, res) {
    const { fields, filters, limit } = req.params;
    const result = await this.compositeAdService.getCompositeAd(fields, filters, limit);
    res.json(result);
  }

  async deleteCompositeAdData(req, res) {
    const { id } = req.query;
    const result = await this.compositeAdService.deleteCompositeAd(id);
    res.json(result);
  }
}

module.exports = CompositeAdController;
