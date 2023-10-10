// Local application imports
const AdInsightsService = require('../services/AdInsightsService');

class AdInsightsController {

  constructor() {
    this.adInsightsService = new AdInsightsService();
  }

  async syncAdInsights(req, res) {
    const { token, adAccountIds, startDate, endDate, preset } = req.query;
    const adInsights = await this.adInsightsService.syncAdInsights(token, adAccountIds, startDate, endDate, preset);
    return res.status(200).json({ adInsights });
  }

  async fetchAdInsights(req, res) {
    const { fields, filters, limit } = req.query;
    const adInsights = await this.adInsightsService.fetchAdInsights(fields, filters, limit);
    return res.status(200).json({ adInsights });
  }

}

module.exports = AdInsightsController;
