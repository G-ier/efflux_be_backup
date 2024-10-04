// Local application imports
const AdCardsService = require('../services/AdCardsService');

class AdCardsController {

  constructor() {
    this.adCardsService = new AdCardsService();
  }

  async saveAdCard(req, res) {
    const { data } = req.body;
    const updatedAdAccountIds = await this.adCardsService.saveAdCard(data);
    res.json(updatedAdAccountIds);
  }

  async fetchAdCards(req, res) {
    const { fields, filters, limit } = req.params;
    const adCards = await this.adCardsService.fetchAdCards(fields, filters, limit);
    res.json(adCards);
  }

  async updateAdCard(req, res) {
    const { data } = req.body;
    const { id } = req.params;
    const updatedAdAccountIds = await this.adCardsService.updateAdCard(data, id);
    res.json(updatedAdAccountIds);
  }

  async deleteAdCard(req, res) {
    const { id } = req.params;
    const numDeleted = await this.adCardsService.deleteById(id);
    res.json(numDeleted);
  }

}

module.exports = AdCardsController;
