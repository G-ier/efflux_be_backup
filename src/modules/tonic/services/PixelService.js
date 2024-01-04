// Local application imports
const TonicBaseService            = require('./TonicBaseService');

class PixelService extends TonicBaseService {

  constructor() {
    super();
  }

  async invokePixel(account, campaign_id) {
    this.logger.info('Invoking Pixel');
    const endpoint = `campaign/pixel/invoke`;
    const body = {
      campaign_id
    }
    const response = await this.makeTonicAPIRequest(account, 'POST', endpoint, body, 'Error invoking Pixel');
    this.logger.info('Invoked Pixel');
    return response;
  }

  async getPixels(account, campaign_id) {
    this.logger.info('Fetching Pixels');
    const endpoint = `campaign/pixel?campaign_id=${campaign_id}`;
    const response = await this.makeTonicAPIRequest(account, 'GET', endpoint, {}, 'Error fetching Pixels');
    this.logger.info('Fetched Pixels');
    return response;
  }

  async createTrafficSourcePixel(account, trafficSource, campaignId, eventName, pixelId, accessToken) {
    this.logger.info(`Creating ${trafficSource} Pixel`);
    const endpoint = `campaign/pixel/${trafficSource}`;
    const body = {
      campaign_id: campaignId,
      event_name: eventName,
      pixel_id: pixelId,
      access_token: accessToken
    }
    const response = await this.makeTonicAPIRequest(account, 'POST', endpoint, body, `Error creating ${trafficSource} Pixel`);
    this.logger.info(`Created ${trafficSource}  Pixel`);
    return response;
  }

}

module.exports = PixelService;
