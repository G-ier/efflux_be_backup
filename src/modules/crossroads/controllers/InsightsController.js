const InsightsService = require("../services/InsightsService");

class InsightsController {

  constructor() {
    this.insightsService = new InsightsService();
  }

  async updateCrossroadsData(req, res) {
    try {
      await this.insightsService.updateCrossroadsData(req.body.account, req.body.request_date);
      res.json({ message: "Crossroads data updated successfully." });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCrossroadsById(req, res) {
    try {
      const crossroads = await this.insightsService.getCrossroadsById(req.params.id);
      res.json(crossroads);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAllCrossroads(req, res) {
    try {
      const allCrossroads = await this.insightsService.getAllCrossroads();
      res.json(allCrossroads);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteCrossroadsById(req, res) {
    try {
      await this.insightsService.deleteCrossroadsById(req.params.id);
      res.json({ message: "Crossroads deleted successfully." });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = InsightsController;
