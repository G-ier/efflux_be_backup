const BaseService = require('../../../shared/services/BaseService');
const { FacebookLogger } = require('../../../shared/lib/WinstonLogger'); // Replace with your actual logger
const UserAccountService = require('./UserAccountService');
const { FB_API_URL } = require('../constants');
const axios = require("axios")
class AdService extends BaseService {
  constructor() {
    super(FacebookLogger);
    this.userAccountService = new UserAccountService();
  }

  async getToken(adminsOnly = true) {
    return (await this.userAccountService.getFetchingAccount(adminsOnly, false, 20)).token;
  }

  async getAdsOfAdset(adSetId) {
    const url = `${FB_API_URL}${adSetId}/ads`;
    const token = await this.getToken();
    try {
      const response = await axios.get(url, {
        params: {
          access_token: token,
          fields: 'id,name,status,creative{title,body,url_tags}',
        },
      });
      console.log(response.data)
      return response.data;
    } catch (error) {
      console.error('Error fetching ads:', error);
      throw error;
    }
  }
  async getDetailsOfAd(adId) {
    const url = `${FB_API_URL}${adId}`;
    const token = await this.getToken();

    try {
      const response = await axios.get(url, {
        params: {
          access_token: token,
          fields: 'id,name,status,creative{title,body,url_tags},insights{clicks,impressions,spend}'
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching ad details:', error);
      throw error;
    }
  }
}

module.exports = AdService;
