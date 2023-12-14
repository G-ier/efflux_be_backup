// Local application imports
const InsightsService             = require('../services/InsightsService');
const { TonicLogger }             = require('../../../shared/lib/WinstonLogger');

class CampaignsController {

    constructor() {
      this.service = new InsightsService();
      this.logger = TonicLogger;
    }

    async syncInsights(req, res) {
      try {
        const { startDate, endDate, hour, final } = req.query;
        const finalBool = final === 'true';
        const insightsSyncedCount = await this.service.syncInsights(startDate, endDate, hour, finalBool);
        res.status(200).send(`Synced ${insightsSyncedCount} Tonic Insights`);
      } catch (error) {
        this.logger.error(`Error syncing Tonic Insights: ${error}`);
        res.status(500).send('Error syncing Tonic Insights');
      }
    }

    async fetchInsights(req, res) {

      try {
        const { fields, filters, limit } = req.query;
        const parsedFields = fields ? JSON.parse(fields) : undefined;
        const parsedFilters = filters ? JSON.parse(filters) : undefined;
        const parsedLimit = limit ? parseInt(limit, 10) : undefined;
        const insights = await this.service.fetchInsights(parsedFields, parsedFilters, parsedLimit);
        res.status(200).json(insights);
      } catch (error) {
        this.logger.error(`Error fetching Tonic Insights: ${error.message}`);
        res.status(500).send('Error fetching Tonic Insights');
      }
    }
}

module.exports = CampaignsController;
