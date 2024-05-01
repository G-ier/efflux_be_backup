// Third party imports
const _ = require('lodash');
const axios = require('axios');
// Local application imports
const ContentRepository = require('../repositories/AdLauncherMediaRepository'); // Adjust the path as necessary
const { FacebookLogger } = require('../../../shared/lib/WinstonLogger');
const { FB_API_URL } = require('../constants');

const BaseService = require('../../../shared/services/BaseService'); // Adjust the import path as necessary
const dynamoDbService = require('../../../shared/lib/DynamoDBService');

class AdLauncherService extends BaseService {
  constructor() {
    super(FacebookLogger);
    this.contentRepository = new ContentRepository();
    this.ddbRepository = dynamoDbService;
  }

  /**
   * Creates a campaign in Facebook's Marketing API
   * @param {*} params
   */
  async createCampaign(campaignData, adAccountId, token) {
    const status = 'PAUSED';
    const payload = {
      ...campaignData,
      status,
    };

    console.log('Campaign Payload -->', JSON.stringify(payload));
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

  async createAdset(adsetData, adAccountId, token, campaignId, adData, isAdvantagePlus) {
    const { status } = adData;
    const {
      name,
      attribution_spec,
      daily_budget,
      bid_amount,
      billing_event,
      optimization_goal,
      targeting,
      promoted_object,
      bid_strategy,
      bid_constraints,
      is_dynamic_creative,
      start_time,
      end_time,
    } = adsetData;

    // TODO: Add device platform targeting logic here
    delete targeting.os;

    if (isAdvantagePlus) {
      FacebookLogger.info('Campaign is Advantage Plus');
      // Don't need to include placements for Advantage Plus
      if (targeting.placements) {
        delete targeting.placements;
      }
    }

    // TODO: Review the attribution spec logic with business.
    // This logic can live in the backend or frontend depending on the business requirements
    // https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-group/

    const payload = {
      name: name,
      daily_budget: daily_budget,
      bid_amount: bid_amount,
      billing_event: billing_event,
      optimization_goal: optimization_goal,
      bid_strategy: bid_strategy,
      bid_constraints: bid_constraints,
      campaign_id: campaignId,
      targeting: targeting,
      promoted_object: promoted_object,
      status: status,
      is_dynamic_creative: is_dynamic_creative,
    };

    if (attribution_spec) {
      payload['attribution_spec'] = [...attribution_spec];
    }

    if (start_time) {
      payload['start_time'] = start_time.slice(0, -1);
    }
    if (end_time) {
      payload['end_time'] = end_time.slice(0, -1);
    }

    FacebookLogger.info('Adset Payload -->', JSON.stringify(payload));

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

  async createDynamicAdCreative(params, token, adAccountId, adsetData) {
    const payload = {
      ...params,
    };

    if (payload.image_hashes) {
      if (adsetData.is_dynamic_creative) {
        payload['asset_feed_spec'] = {
          ...params.asset_feed_spec,
          images: [...params.image_hashes],
        };
      } else {
        const imageHash = params.image_hashes[0].hash;
        payload['object_story_spec'] = {
          ...params.object_story_spec,
          link_data: {
            ...params.object_story_spec.link_data,
            image_hash: imageHash,
          },
        };
      }
    }

    if (payload.video_ids) {
      if (adsetData.is_dynamic_creative) {
        // TODO: Fix the hardcoded image URL
        const videos = payload.video_ids.map((vid, index) => ({
          video_id: vid,
          thumbnail_url: payload.thumbnails[index]
            ? payload.thumbnails[index]
            : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMGcc3bQc6Hk-Xd6PZsPZme9-Ecza-2UwFibDLZSQI-A&s',
        }));

        if (payload.image_hashes) {
          payload['asset_feed_spec'] = {
            ...payload['asset_feed_spec'],
            videos: videos,
          };
        } else {
          payload['asset_feed_spec'] = {
            ...params.asset_feed_spec,
            videos: videos,
          };
        }
      } else {
        payload['object_story_spec'] = {
          ...params.object_story_spec,
          video_data: {
            ...params.object_story_spec.video_data,
            video_id: payload.video_ids[0],
            image_url:
              payload.thumbnails[0] ||
              'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMGcc3bQc6Hk-Xd6PZsPZme9-Ecza-2UwFibDLZSQI-A&s',
          },
        };
      }
    }

    if (payload.image_hashes) {
      delete payload.image_hashes;
    }

    if (payload.video_ids) {
      delete payload.video_ids;
    }

    if (payload.thumbnails) {
      delete payload.thumbnails;
    }

    FacebookLogger.info('Dynamic Ad Creative Payload ==>', JSON.stringify(payload));
    console.log('Dynamic Ad Creative Payload ==>', JSON.stringify(payload));

    const url = `${FB_API_URL}act_${adAccountId}/adcreatives`;

    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('RESPONSE', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.log('Creative-ERROR', JSON.stringify(error));
      throw error?.response?.data?.error;
    }
  }

  async createNewAd(name, adSetId, creativeId, adAccountId, token) {
    const payload = {
      name: name,
      adset_id: adSetId,
      creative: {
        creative_id: creativeId,
      },
      status: 'PAUSED',
    };

    const url = `${FB_API_URL}act_${adAccountId}/ads`;
    console.log('New Ad Payload', JSON.stringify(payload));

    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.log('Creative-ERROR', JSON.stringify(error));
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
    delete payload['images'];
    delete payload['videos'];

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
    const images = await this.ddbRepository.scanItemsByAdAccountIdAndFbhash({
      adAccountId: adAccountId,
    });
    const uploadedMedia = images.map((image) => {
      return {
        hash: image.fbhash.S,
      };
    });
    return uploadedMedia;
  }

  async saveTargetsToDynamoDB(payload) {
    try {
      const tenant = 'roi'; // This should be dynamic
      const generatedDestinationUrl = `https://${payload.destinationUrl}?tenant=${tenant}&utm_campaign=${payload.campaignId}&ref_adnetwork=facebook&ref_pubsite=facebook&`;
      return await this.ddbRepository.putTargetUrl(payload, generatedDestinationUrl);
    } catch (error) {
      this.logger.error(`Error saving target URL: ${error}`);
      throw error;
    }
  }
}

module.exports = AdLauncherService;
