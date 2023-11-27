// Third party imports
const _ = require("lodash");

// Local application imports
const { TiktokLogger } = require("../../../shared/lib/WinstonLogger");
const PixelsRepository = require('../repositories/PixelsRepository');
const BaseService = require("../../../shared/services/BaseService");
const { getTikTokEndpointData } = require("../helpers");


class PixelService extends BaseService {

    constructor() {
      super(TiktokLogger);
      this.pixelRepository = new PixelsRepository();
    }

    async getPixelsFromApi(token, adAccountIds) {
        this.logger.info("Fetching Pixels from API");
        const response = await getTikTokEndpointData("pixel", token, adAccountIds, {}, 'list');
        return response
    }

    async syncPixels(token, adAccountIds, adAccountsMap) {

        this.logger.info("Syncing Pixels");
        const pixels = await this.getPixelsFromApi(token, adAccountIds);
        this.logger.info(`Upserting ${pixels.length} Pixels`);

        await this.executeWithLogging(
          () => this.pixelRepository.upsert(pixels, adAccountsMap, 500),
          "Error Upserting Pixels"
        );

        this.logger.info(`Done upserting Pixels`);
        return pixels.map((pixel) => pixel.pixel_id);
    }

    async fetchPixelsFromDatabase(fields = ['*'], filters = {}, limit, joins = []) {
      const results = await this.pixelRepository.fetchPixels(fields, filters, limit, joins);
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

module.exports = PixelService;
