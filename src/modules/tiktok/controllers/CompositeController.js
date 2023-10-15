const CompositeService = require("../services/CompositeService");

class CompositeController {
  constructor() {
    this.compositeService = new CompositeService();
  }

  async updateData(req, res) {
    const { date } = req.query;
    try {
      await this.compositeService.updateTikTokData(date);
      res.status(200).json({ message: "TikTok data updated successfully." });
    } catch (error) {
      console.error("Error updating TikTok data in controller: ", error);
      res.status(500).json({ message: "Error updating TikTok data.", error: error.message });
    }

    
  }
  async updateEntity(req, res) {
    const { entityId, status, dailyBudget, type } = req.query;
    try {
      const updated = await this.compositeService.updateEntity({ type, entityId, status, dailyBudget });

      res.status(200).json({ updated });
    } catch ({ message }) {
      res.status(500).json({ updated: false, message });
    }
  }
}
module.exports = CompositeController;
