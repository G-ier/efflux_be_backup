// Local application imports
const { TonicLogger }             = require("../../../shared/lib/WinstonLogger");
const CampaignsService            = require('../services/CampaignsService');

class CampaignsController {

    constructor() {
      this.service = new CampaignsService();
      this.logger = TonicLogger;
    }

    async getCampaignCallback(req, res) {
      try {
        const { campaign_id } = req.query;
        const callback = await this.service.fetchCampaignCallback(campaign_id);
        res.status(200).json(callback);
      } catch (error) {
        this.logger.error(`Error fetching Tonic Campaign Callback: ${error.message}`);
        res.status(500).send('Error fetching Tonic Campaign Callback');
      }
    }

    async fetchCampaigns(req, res) {

      try {
        const { fields, filters, limit } = req.query;
        const parsedFields = fields ? JSON.parse(fields) : undefined;
        const parsedFilters = filters ? JSON.parse(filters) : undefined;
        const parsedLimit = limit ? parseInt(limit, 10) : undefined;
        const campaigns = await this.service.fetchCampaigns(parsedFields, parsedFilters, parsedLimit);
        res.status(200).json(campaigns);
      } catch (error) {
        this.logger.error(`Error fetching Tonic Campaigns: ${error.message}`);
        res.status(500).send('Error fetching Tonic Campaigns');
      }
    }
}

module.exports = CampaignsController;
