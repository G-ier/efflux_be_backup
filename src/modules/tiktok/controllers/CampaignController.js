const CampaignService = require("../services/CampaignsService");

class CampaignController {
  constructor() {
    this.service = new CampaignService();
  }
}

module.exports = CampaignController;
