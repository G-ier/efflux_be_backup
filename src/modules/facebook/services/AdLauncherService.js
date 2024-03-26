// Third party imports
const _ = require("lodash");
const axios = require("axios")
// Local application imports
const ContentRepository = require("../repositories/AdLauncherMediaRepository"); // Adjust the path as necessary
const { FacebookLogger } = require("../../../shared/lib/WinstonLogger");
const { FB_API_URL } = require("../constants");

const BaseService = require("../../../shared/services/BaseService"); // Adjust the import path as necessary

class AdLauncherService extends BaseService {
  constructor() {
    super(FacebookLogger);
    this.contentRepository = new ContentRepository();
  }

  // TODO: Fix this method
  async createAdCreative(token, adAccountId, creativeData) {
    const { uploadedMedia, pageId } = creativeData;
    const payload = {
      "name": "Sample Image Ad Creative",
      "object_story_spec": {
        "link_data": {
          "image_hash": uploadedMedia[0].hash,
          "link": "app.maximizer.io/176e5d5c/943286260346857/rrt/rtrt/",
          "message": "Try our product now!"
        },
        "page_id": pageId,
      },
    }

    console.log('Ad-Creative Payload', payload);

    const url = `${FB_API_URL}act_${adAccountId}/adcreatives`;
    // Construct the request payload according to the Facebook API specifications

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

}

module.exports = AdLauncherService;
