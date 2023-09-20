// Third party imports
const axios = require("axios");
const async = require("async");
const _ = require("lodash");

// Local application imports
const PixelRepository = require('../repositories/PixelsRepository');
const { FB_API_URL, delay } = require('../constants');
const { FacebookLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");

const { sendSlackNotification } = require('../../../shared/lib/SlackNotificationService');
class PixelsService extends BaseService {

  constructor() {
    super(FacebookLogger);
    this.pixelRepository = new PixelRepository();
  }

  async getPixelsFromApi(access_token, adAccountIds) {

    this.logger.info(`Fetching Pixels from API`);
    const fields = "id,name,account_id,owner_business,is_unavailable,last_fired_time,creation_time,data_use_setting,ad_";
    const results = {sucess: [], error: []}

    const allPixels = await async.mapLimit(adAccountIds, 100, async (adAccountId) => {
      let paging = {};
      const pixels = []
      let url = `${FB_API_URL}${adAccountId}/adspixels`;
      let params = {
        fields,
        access_token,
        limit: 5000,
      };

      do {
        if (paging?.next) {
          url = paging.next;
          params = {};
        }

        const { data = [] } = await axios
          .get(url, {
            params,
          })
          .catch((err) => {
            results.error.push(adAccountId);
            return {};
          });

        results.sucess.push(adAccountId);
        paging = { ...data?.paging };
        if (data?.data?.length) pixels.push(...data.data);
        await delay(1000);
      } while (paging?.next);

      return pixels.length ? pixels.map((item) => ({ ...item, ad_account_id: adAccountId.replace("act_", "") })) : [];
    });

    if (results.sucess.length === 0) throw new Error("All ad accounts failed to fetch pixels");
    this.logger.info(`Ad Accounts pixel fetching telemetry: SUCCESS(${results.sucess.length}) | ERROR(${results.error.length})`);
    return _.flatten(allPixels)
  }

  async syncPixels(access_token, adAccountIds, adAccountsMap, date = "today") {
    const pixels = await this.getPixelsFromApi(access_token, adAccountIds, date);

    this.logger.info(`Upserting ${pixels.length} Pixels`);
    await this.executeWithLogging(
      () => this.pixelRepository.upsert(pixels, adAccountsMap, 500),
      "Error Upserting Pixels"
    )
    this.logger.info(`Done upserting Pixels`);
    return pixels.map((pixel) => pixel.id);
  }

  async fetchPixelsFromDatabase(fields = ['*'], filters = {}, limit) {
    const results = await this.pixelRepository.fetchPixels(fields, filters, limit);
    return results;
  }

  async savePixelInDatabase(pixel) {
    const pixelId = await this.pixelRepository.saveOne(pixel);
    return pixelId;
  }

  async updatePixelInDatabase(updateFields, id) {
    const pixelId = await this.pixelRepository.update(updateFields, { pixel_id: id });
    return pixelId;
  }

  async deletePixelInDatabase(id) {
    const deleted = await this.pixelRepository.delete({ pixel_id: id });
    return deleted;
  }

}

module.exports = PixelsService;
