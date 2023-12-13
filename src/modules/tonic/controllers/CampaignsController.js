// Local application imports
const CampaignsService            = require('../services/CampaignsService');

class CampaignsController {

    constructor() {
      this.service = new CampaignsService();
    }

    async syncCampaigns(req, res) {
      try {
        const campaignsSyncedCount = await this.service.syncCampaigns();
        res.status(200).send(`Synced ${campaignsSyncedCount} Tonic Campaigns`);
      } catch (error) {
        this.logger.error(`Error syncing Tonic Campaigns: ${error.message}`);
        res.status(500).send('Error syncing Tonic Campaigns');
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
