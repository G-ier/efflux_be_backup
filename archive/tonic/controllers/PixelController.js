// Local application imports
const PixelService                = require('../services/PixelService');

class PixelController {

  constructor() {
    this.service = new PixelService();
  }

  async invokePixel(req, res) {
    try {
      const { campaign_id } = req.body;
      const pixel = await this.service.invokePixel(campaign_id);
      res.status(200).json(pixel);
    } catch (error) {
      this.logger.error(`Error invoking Pixel: ${error.message}`);
      res.status(500).send('Error invoking Pixel');
    }
  }

  async getPixels(req, res) {
    try {
      const { campaign_id } = req.query;
      const pixels = await this.service.getPixels(campaign_id);
      res.status(200).json(pixels);
    } catch (error) {
      this.logger.error(`Error fetching Pixels: ${error.message}`);
      res.status(500).send('Error fetching Pixels');
    }
  }

  async createTrafficSourcePixel(req, res) {
    try {
      const { trafficSource, campaign_id, event_name, pixel_id, send_revenue, domain_verification, access_token, deduplication_parameter } = req.body;
      const pixel = await this.service.createTrafficSourcePixel(trafficSource,
        campaign_id, event_name,
        pixel_id, send_revenue,
        domain_verification, access_token,
        deduplication_parameter
      );
      res.status(200).json(pixel);
    } catch (error) {
      this.logger.error(`Error creating Tonic Pixel: ${error.message}`);
      res.status(500).send('Error creating Tonic Pixel');
    }
  }

}

module.exports = PixelController;
