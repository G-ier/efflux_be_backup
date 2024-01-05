// Local application imports
const CompositeService              = require('../services/CompositeService');
const { TonicLogger }               = require('../../../shared/lib/WinstonLogger');

class CompositeController {

    constructor() {
      this.service = new CompositeService();
      this.logger = TonicLogger;
    }

    async syncData(req, res) {
      try {
        const { startDate, endDate, hour, final } = req.query;
        const finalBool = final === 'true';
        const insightsSyncedCount = await this.service.updateData(startDate, endDate, hour, finalBool);
        res.status(200).send(`Synced ${insightsSyncedCount} Tonic Insights`);
      } catch (error) {
        this.logger.error(`Error syncing Tonic Insights: ${error}`);
        res.status(500).send('Error syncing Tonic Insights');
      }
    }

    async getCampaignPixle(req, res) {
      try {
        const { campaign_id } = req.query;
        const pixel = await this.service.getCampaignPixle(campaign_id);
        res.status(200).send(pixel);
      } catch (error) {
        this.logger.error(`Error fetching Tonic Pixel: ${error}`);
        res.status(500).send('Error fetching Tonic Pixel');
      }
    }

    async invokeCampaignsPixel(req, res) {
      try {
        const { campaign_id } = req.body;
        const response = await this.service.invokeCampaignsPixel(campaign_id);
        res.status(200).send(response);
      } catch (error) {
        this.logger.error(`Error invoking Tonic Pixel: ${error}`);
        res.status(500).send('Error invoking Tonic Pixel');
      }
    }

    async createTrafficSourcePixel(req, res) {
      try {
        const { trafficSource, campaignId, eventName, pixelId, accessToken } = req.body;
        const response = await this.service.createTrafficSourcePixel(trafficSource, campaignId, eventName, pixelId, accessToken);
        res.status(200).send(response);
      } catch (error) {
        this.logger.error(`Error creating Tonic Pixel: ${error}`);
        res.status(500).send('Error creating Tonic Pixel');
      }
    }

}

module.exports = CompositeController;
