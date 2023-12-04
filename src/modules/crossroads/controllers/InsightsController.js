const InsightsService = require("../services/InsightsService");
const { CROSSROADS_ACCOUNTS }  = require('../constants');

class InsightsController {

  constructor() {
    this.insightsService = new InsightsService();
  }

  async updateCrossroadsData(req, res) {
    try {
      const { account, request_date, save_aggregated, save_raw_data, save_raw_data_to_file } = req.body;
      const saveAggregatedData = ![false, 'false'].includes(save_aggregated)
      await this.insightsService.updateCrossroadsData(account, request_date, saveAggregatedData, save_raw_data, save_raw_data_to_file);
      res.json({ message: "Crossroads data updated successfully." });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getTrafficSourceNakedLinks(req, res) {
    try {
      const { campaign_id } = req.query;
      const account = CROSSROADS_ACCOUNTS[0];
      console.log("Acc Key", account.key, "Campaign Id", campaign_id)
      const nakedLinks = await this.insightsService.getTrafficSourceNakedLinks(account.key, campaign_id);
      res.json(nakedLinks);
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
