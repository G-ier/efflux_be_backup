const CompositeService = require("../services/CompositeService");

class CompositeController {
  constructor() {
    this.service = new CompositeService();
  }

  async updateData(req, res) {
    let { date, endDate, adAccountIdsLimitation, uPixels, uCampaigns, uAdsets, uAds, uInsights } = req.query;
    uPixels = uPixels === "true";
    uCampaigns = uCampaigns === "true";
    uAdsets = uAdsets === "true";
    uAds = uAds === "true";
    uInsights = uInsights === "true";
    try {
      if (adAccountIdsLimitation) {
        adAccountIdsLimitation = JSON.parse(adAccountIdsLimitation);
      }
      await this.service.updateTikTokData(date, endDate, adAccountIdsLimitation, uPixels, uCampaigns, uAdsets, uAds, uInsights);
      res.status(200).json({ message: "TikTok data updated successfully." });
    } catch (error) {
      console.error("Error updating TikTok data in controller: ", error);
      res.status(500).json({ message: "Error updating TikTok data.", error: error.message });
    }

  }
  async updateEntity(req, res) {
    const { entityId, status, dailyBudget, type } = req.query;
    try {
      const updated = await this.service.updateEntity({ type, entityId, status, dailyBudget });

      res.status(200).json({ updated });
    } catch ({ message }) {
      res.status(500).json({ updated: false, message });
    }
  }
}
module.exports = CompositeController;
