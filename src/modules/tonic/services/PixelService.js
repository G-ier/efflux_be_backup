// Local application imports
const TonicBaseService            = require('./TonicBaseService');

class PixelService extends TonicBaseService {

  constructor() {
    super();
  }

  async invokePixel(campaign_id) {
    this.logger.info('Invoking Pixel');
    const endpoint = `campaign/pixel/invoke`;
    const body = {
      campaign_id
    }
    const response = await this.makeTonicAPIRequest('POST', endpoint, body, 'Error invoking Pixel');
    this.logger.info('Invoked Pixel');
    return response;
  }

  async getPixels(campaign_id) {
    this.logger.info('Fetching Pixels');
    const endpoint = `campaign/pixel?campaign_id=${campaign_id}`;
    const response = await this.makeTonicAPIRequest('GET', endpoint, {}, 'Error fetching Pixels');
    this.logger.info('Fetched Pixels');
    return response;
  }

  async createTrafficSourcePixel(trafficSource) {
    this.logger.info(`Creating ${trafficSource} Pixel`);
    const endpoint = `campaign/pixel/${trafficSource}`;
    const response = await this.makeTonicAPIRequest('POST', endpoint, {}, `Error creating ${trafficSource} Pixel`);
    this.logger.info(`Created ${trafficSource}  Pixel`);
    return response;
  }

}

module.exports = PixelService;
