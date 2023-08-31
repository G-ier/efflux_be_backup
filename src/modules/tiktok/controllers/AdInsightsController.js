const AdInsightsService = require("../services/AdInsightsService");

class AdInsightsController {
  constructor() {
    this.adInsightsService = new AdInsightsService();
  }

  async updateTikTokInsights(req, res) {
    try {
      const date = req.params.date;
      await this.adInsightsService.getTikTokAdInsights(date);
      res.status(200).json({ message: "TikTok insights updated successfully." });
    } catch (error) {
      console.error("Error updating tik-tok insights: ", error);
      // await this.adInsightsService.sendSlackNotification("Error updating tik-tok insights: ", error);
      res.status(500).json({ message: "Error updating TikTok insights.", error: error.message });
    }
  }
}

module.exports = AdInsightsController;
