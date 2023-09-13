const CampaignService = require("../services/CampaignsService");

class CampaignController {
  constructor() {
    this.campaignService = new CampaignService();
  }
}

module.exports = CampaignController;
