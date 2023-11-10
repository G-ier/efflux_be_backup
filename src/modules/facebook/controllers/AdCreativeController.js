// Local application imports
const AdCreativesService = require("../services/AdCreativesService");

class AdCreativesController {
  constructor() {
    this.adCreativesService = new AdCreativesService();
    this.syncAdCreatives = this.syncAdCreatives.bind(this);
    this.fetchAdCreatives = this.fetchAdCreatives.bind(this);
    this.updateAdCreative = this.updateAdCreative.bind(this);
    this.deleteAdCreative = this.deleteAdCreative.bind(this);
    this.fetchAdCreativeById = this.fetchAdCreativeById.bind(this);
  }

  async syncAdCreatives(req, res) {
    const { token, adAccountIds, adAccountsMap, date } = req.body;
    const adCreativeIds = await this.adCreativesService.syncAdCreatives(token, adAccountIds, adAccountsMap, date);
    res.json(adCreativeIds);
  }

  async fetchAdCreatives(req, res) {
    const { fields, filters, limit } = req.body;
    const adCreatives = await this.adCreativesService.fetchAdCreativesFromDatabase(fields, filters, limit);
    res.json(adCreatives);
  }


  async updateAdCreative(req, res) {
    const { creativeId } = req.params;
    const adCreativeData = req.body;
    const updatedAdCreative = await this.adCreativesService.updateAdCreative(creativeId, adCreativeData);
    res.json(updatedAdCreative);
  }

  async deleteAdCreative(req, res) {
    const { creativeId } = req.params;
    const { token } = req.body;
    await this.adCreativesService.deleteAdCreative(creativeId, token);
    res.json({ message: "Ad creative successfully deleted." });
  }

  async fetchAdCreativeById(req, res) {
    const { creativeId } = req.params;
    const adCreative = await this.adCreativesService.fetchAdCreativeById(creativeId);
    if (adCreative) {
      res.json(adCreative);
    } else {
      res.status(404).json({ message: "Ad creative not found." });
    }
  }
}

module.exports = AdCreativesController;
