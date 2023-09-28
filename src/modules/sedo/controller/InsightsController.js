const InsightsService = require('../services/InsightsService');

class InsightsController {
  constructor() {
    this.service = new InsightsService();
  }

  async syncInsights(req, res) {
    const { date } = req.body;
    await this.service.getInsightsFromApi(date);
    return res.status(200).json({ adInsights });
  }

}

module.exports = InsightsController;
