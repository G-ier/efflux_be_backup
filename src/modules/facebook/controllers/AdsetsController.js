// Local application imports
const AdsetsService = require('../services/AdsetsService');

class AdsetsController {

  constructor() {
    this.adsetsService = new AdsetsService();
  }

  async syncAdsets(req, res) {
    const { token, adAccountIds, adAccountsMap, campaignIds, startDate, endDate, preset } = req.body;
    const adsetIds = await this.adsetsService.syncAdsets(token, adAccountIds, adAccountsMap, campaignIds, startDate, endDate, preset);
    res.json(adsetIds);
  }

  async fetchAdsets(req, res) {
    try {
      // Extracting the query parameters from the URL
      const { fields, filters, limit } = req.query;
  
      const parsedFields = fields ? JSON.parse(fields) : undefined;
      const parsedFilters = filters ? JSON.parse(filters) : undefined;
      const parsedLimit = limit ? parseInt(limit, 10) : undefined;
  
      // Fetching adsets from the database service with the query parameters
      const adsets = await this.adsetsService.fetchAdsetsFromDatabase(parsedFields, parsedFilters, parsedLimit);
  
      // Sending the response back as JSON
      res.json(adsets);
    } catch (error) {
      // Send a 500 Internal Server Error response, or any other status code as appropriate
      res.status(500).send('An error occurred while fetching adsets');
    }
  }
  
}

module.exports = AdsetsController;
