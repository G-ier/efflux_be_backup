// Local application imports
const CreativesService = require('../services/CreativesService');

class CreativesController {

  constructor() {
    this.creativesService = new CreativesService();
  }

  async saveCreative(req, res) {
    const { data } = req.body;
    const insertedId = await this.creativesService.saveCreative(data);
    res.json(insertedId);
  }

  async fetchCreatives(req, res) {
    const { fields, filters, limit } = req.query;
    const creatives = await this.creativesService.fetchCreatives(fields, filters, limit);
    res.json(creatives);
  }

  async updateCreative(req, res) {
    const { data } = req.body;
    const { id } = req.params;
    const updatedAdAccountIds = await this.creativesService.updateCreative(data, id);
    res.json(updatedAdAccountIds);
  }

  async deleteCreative(req, res) {
    const { id } = req.params;
    const numDeleted = await this.creativesService.deleteById(id);
    res.json(numDeleted);
  }

}

module.exports = CreativesController;
