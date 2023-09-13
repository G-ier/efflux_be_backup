const AdAccountService = require("../services/AdAccountsService");

class AdAccountController {
  constructor() {
    this.adAccountService = new AdAccountService();
  }
}

module.exports = AdAccountController;
