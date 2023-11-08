const InsightsService = require('../services/InsightsService');

class InsightsController {
  constructor() {
    this.service = new InsightsService();
  }

  async syncInsights(req, res) {
    const { date, final } = req.query;
    try {
      await this.service.syncSedoInsights(date, final === 'true');
      return res.status(200).json(`Sedo insights for date ${date} synced successfully`);
    } catch (err) {
      return res.status(500).json(err.message);
    }
  }

}

module.exports = InsightsController;
