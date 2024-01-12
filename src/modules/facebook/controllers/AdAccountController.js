// Local application imports
const AdAccountService = require('../services/AdAccountService');

class AdAccountController {

  constructor() {
    this.adAccountService = new AdAccountService();
  }

  async syncAdAccounts(req, res) {
    const { providerId, userId, accountId, token } = req.body;
    const adAccountIds = await this.adAccountService.syncAdAccounts(providerId, userId, accountId, token);
    res.json(adAccountIds);
  }

  async fetchAdAccountsFromDatabase(req, res) {
    const { fields, filters, limit } = req.query;
    const results = await this.adAccountService.fetchAdAccountsFromDatabase(fields, filters, limit);
    res.json(results);
  }

  async fetchAdAccountsMapFromDatabase(req, res) {
    const { fields, filters } = req.query;
    console.log(req.query);
    const results = await this.adAccountService.fetchAdAccountsMapFromDatabase(fields, filters);
    res.json(results);
  }

}

module.exports = AdAccountController;
