// Third party imports
const _ = require("lodash");
const axios = require("axios")
// Local application imports
const ContentRepository = require("../repositories/AdLauncherMediaRepository"); // Adjust the path as necessary
const { FacebookLogger } = require("../../../shared/lib/WinstonLogger");
const { FB_API_URL } = require("../constants");

const BaseService = require("../../../shared/services/BaseService"); // Adjust the import path as necessary
const DynamoRepository = require("../../../shared/lib/DynamoDBRepository");

class AdLauncherService extends BaseService {
  constructor() {
    super(FacebookLogger);
    this.contentRepository = new ContentRepository();
    this.ddbRepository = new DynamoRepository();
  }

  /**
   * Creates a campaign in Facebook's Marketing API
   * @param {*} params
   */
  async createCampaign (campaignData, adAccountId, token) {
    const { name, objective, special_ad_categories } = campaignData;
    const status = "PAUSED";
    const payload = {
      name,
      objective,
      status,
      special_ad_categories,
    };

    const url = `${FB_API_URL}act_${adAccountId}/campaigns`;
    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error?.response?.data?.error;
    }
  }

  async createAdset(adsetData, adAccountId, token, campaignId) {
    const {
      name,
      daily_budget,
      bid_amount,
      billing_event,
      optimization_goal,
      targeting,
      promoted_object,
    } = adsetData;
    const payload = {
      "name": name,
      "daily_budget": daily_budget,
      "bid_amount": bid_amount,
      "billing_event": billing_event,
      "optimization_goal": optimization_goal,
      "campaign_id": campaignId,
      "targeting": targeting,
      "promoted_object": promoted_object,
      "status": "PAUSED",
      "is_dynamic_creative": true
    };

    const url = `${FB_API_URL}act_${adAccountId}/adsets`;
    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error?.response?.data?.error;
    }
  }

  async createDynamicAdCreative(params, token, adAccountId) {
    const mediaHashes = await this.getImageHashesFromDynamoDB(adAccountId);
    const payload = {
      ...params,
      "dynamic_ad_voice": "DYNAMIC",
      "asset_feed_spec": {
        ...params.asset_feed_spec,
        "images": mediaHashes,
      }
    }

    console.log('Dynamic Ad Creative Payload', JSON.stringify(payload));
    const url = `${FB_API_URL}act_${adAccountId}/adcreatives`;

    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error?.response?.data?.error;
    }
  }

  async createAd({ token, adAccountId, adData }) {
    const url = `${FB_API_URL}act_${adAccountId}/ads`;
    // Construct the request payload according to the Facebook API specifications
    const payload = {
      ...adData,
      access_token: token,
    };

    // Dont include the images and videos sent for processing to get hashes and id-s
    delete payload["images"];
    delete payload["videos"];

    try {
      // Make the post request to the Facebook API
      const response = await axios.post(url, payload);

      // Handle the response. Assuming the API returns a JSON with the created ad's ID
      const createdAdId = response.data.id;

      // Return a success response, or the ad ID, depending on what is needed
      return {
        success: true,
        id: createdAdId,
      };
    } catch (error) {
      // Log the error and throw it to be handled by the caller
      this.logger.error(`Error creating ad: ${error.response}`);
      throw error?.response?.data?.error;
    }
  }

  async getImageHashesFromDynamoDB(adAccountId) {
    const images = await this.ddbRepository.scanItemsByAdAccountIdAndFbhash({ adAccountId: adAccountId });
    const uploadedMedia = images.map((image) => {
      return {
        hash: image.fbhash.S,
      };
    });
    return uploadedMedia;
  }

}

module.exports = AdLauncherService;
