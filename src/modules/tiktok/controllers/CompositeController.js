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
}

module.exports = CompositeController;
