const AdsService = require("../services/AdsService");

class AdsController {
  constructor() {
    this.adsService = new AdsService();
  }
}

module.exports = AdsController;
