// Third party imports
const axios = require("axios");
const async = require("async");
const _ = require("lodash");

// Local application imports
const PixelRepository = require('../repositories/PixelsRepository');
const { FB_API_URL } = require('../constants');
const { sendSlackNotification } = require('../../../shared/lib/SlackNotificationService');
class PixelsService {

  constructor() {
    this.pixelRepository = new PixelRepository();
  }

  async getPixelsFromApi(access_token, adAccountIds) {
    const fields = "id,name,account_id,owner_business,is_unavailable,last_fired_time,creation_time,data_use_setting,ad_";
    const allPixels = await async.mapLimit(adAccountIds, 100, async (adAccountId) => {
      const url = `${FB_API_URL}${adAccountId}/adspixels`;
      const response = await axios
        .get(url, {
          params: {
            fields,
            access_token,
            limit: 5000,
          },
        })
        .catch(({ response: { data }}) =>
          {
            if (!data.error.code === 80004 && !data.error.error_subcode === 2446079) {
              console.log(`${adAccountId} - ${data.error.message}`);
            }
          }
        );

      return response?.data?.data.map((item) => ({ ...item, ad_account_id: adAccountId.replace("act_", "") })) || [];
    });

    return _.flatten(allPixels);
  }

  async syncPixels(access_token, adAccountIds, adAccountsMap, date = "today") {
    const pixels = await this.getPixelsFromApi(access_token, adAccountIds, date);
    try{
      await this.pixelRepository.upsert(pixels, adAccountsMap, 500);
    } catch (e) {
      console.log("ERROR UPDATING PIXELS", e);
      await sendSlackNotification("ERROR UPDATING PIXELS. Inspect software if this is a error", e)
      return [];
    }
    return pixels.map((pixel) => pixel.id);
  }

  async fetchPixelsFromDatabase(fields = ['*'], filters = {}, limit) {
    const results = await this.pixelRepository.fetchPixels(fields, filters, limit);
    return results;
  }

}

module.exports = PixelsService;
