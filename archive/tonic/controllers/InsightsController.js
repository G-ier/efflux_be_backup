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

    async fetchInsightsClickhouse(req, res) {

      try {
        const { network, ts, startDate, endDate } = req.query;
        if(!network){
          res.status(500).send('No network given.');
        }
        if(!ts){
          res.status(500).send('No network given.');
        }
        if(!startDate){
          res.status(500).send('No network given.');
        }
        if(!endDate){
          res.status(500).send('No network given.');
        }
        //const parsedFields = fields ? JSON.parse(fields) : undefined;
        //const parsedFilters = filters ? JSON.parse(filters) : undefined;
        //const parsedLimit = limit ? parseInt(limit, 10) : undefined;
        const insights = await this.service.fetchInsightsClickhouse(network, ts, startDate, endDate);
        res.status(200).json(insights);
      } catch (error) {
        this.logger.error(`Error fetching Tonic Insights: ${error.message}`);
        res.status(500).send('Error fetching Tonic Insights');
      }
    }

    // get campaigns
    async fetchCampaignsClickhouse(req, res) {

      try {
        const { campaign_id } = req.query;
        if(!campaign_id){
          res.status(500).send('No network given.');
        }
        //const parsedFields = fields ? JSON.parse(fields) : undefined;
        //const parsedFilters = filters ? JSON.parse(filters) : undefined;
        //const parsedLimit = limit ? parseInt(limit, 10) : undefined;
        const insights = await this.service.fetchCampaignsClickhouse(campaign_id);
        res.status(200).json(insights);
      } catch (error) {
        this.logger.error(`Error fetching Tonic Campaigns: ${error.message}`);
        res.status(500).send('Error fetching Tonic Campaigns');
      }
    }

    // get adsets
    async fetchAdsetsClickhouse(req, res) {

      try {
        const { adset_id } = req.query;
        if(!adset_id){
          res.status(500).send('No network given.');
        }
        //const parsedFields = fields ? JSON.parse(fields) : undefined;
        //const parsedFilters = filters ? JSON.parse(filters) : undefined;
        //const parsedLimit = limit ? parseInt(limit, 10) : undefined;
        const insights = await this.service.fetchAdsetsClickhouse(adset_id);
        res.status(200).json(insights);
      } catch (error) {
        this.logger.error(`Error fetching Tonic Adsets: ${error.message}`);
        res.status(500).send('Error fetching Tonic Adsets');
      }
    }
}

module.exports = CampaignsController;
