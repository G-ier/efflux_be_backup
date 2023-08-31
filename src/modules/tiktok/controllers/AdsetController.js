const AdsetService = require("../services/AdsetsService");

class AdsetController {
  constructor() {
    this.adsetService = new AdsetService();
  }
}

module.exports = AdsetController;
