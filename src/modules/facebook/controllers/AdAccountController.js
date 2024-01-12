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
    try {
      const results = await this.adAccountService.fetchAdAccountsMapFromDatabase();
      res.json(results);
    } catch (err) {
      res.status(500).json(err);
    }
  }
  async assignUserAccountToAdAccount(req, res){
    try{
      const { ad_account, user_account } = req.body;
      const updateData = { ua_id: user_account }
      const criterion = { aa_id: ad_account }
      await this.adAccountService.updatePrioritiesMap(updateData, criterion);
      res.json(ad_account);
    } catch (err){
      console.log(err)
      res.status(500).json(err);
    }
  }

}

module.exports = AdAccountController;
