const AdInsightsService = require("../services/AdInsightsService");

class AdInsightsController {
  constructor() {
    this.adInsightsService = new AdInsightsService();
  }
}

module.exports = AdInsightsController;
