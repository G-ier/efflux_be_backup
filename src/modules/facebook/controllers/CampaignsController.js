// Local application imports
const CampaignsService = require('../services/CampaignsService');

class CampaignsController {

  constructor() {
    this.campaignService = new CampaignsService();
  }

  async syncCampaigns(req, res) {
    const { token, adAccountIds, adAccountsMap, startDate, endDate, preset } = req.body;
    const campaignIds = await this.campaignService.syncCampaigns(token, adAccountIds, adAccountsMap, startDate, endDate, preset);
    res.json(campaignIds);
  }

  async fetchCampaigns(req, res) {
    try {
      // Extracting the query parameters from the URL
      const { fields, filters, limit } = req.query;

      const parsedFields = fields ? JSON.parse(fields) : undefined;
      const parsedFilters = filters ? JSON.parse(filters) : undefined;
      const parsedLimit = limit ? parseInt(limit, 10) : undefined;

      // Fetching campaigns from the database service with the query parameters
      const campaigns = await this.campaignService.fetchCampaignsFromDatabase(parsedFields, parsedFilters, parsedLimit);

      // Sending the response back as JSON
      res.json(campaigns);
    } catch (error) {
      // Log the error for debugging purposes
      console.error('Failed to fetch campaigns:', error);

      // Send an HTTP 500 Internal Server Error status code and error message
      res.status(500).json({ message: 'Failed to fetch campaigns', error: error.message });
    }
  }

  async fetchCampaignsFromClickhouse(req, res) {
    try{
      const { campaign_id, startDate, endDate } = req.query;
      if(!campaign_id){
        res.status(500).send('No campaign_id given.');
      }

      const campaigns = await this.campaignService.fetchCampaignsFromClickhouse(campaign_id, startDate, endDate);
      res.status(200).json(campaigns);
    } catch (error) {
      this.logger.error(`Error fetching Facebook Campaigns: ${error.message}`);
      res.status(500).send('Error fetching Facebook Campaigns');
    }
  }

}

module.exports = CampaignsController;
