const _ = require("lodash");
const Pixel = require('../entities/Pixel');
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");

class PixelRepository {
  constructor(database) {
    this.tableName = "fb_pixels";
    this.database = database || new DatabaseRepository();
  }

  async saveOne(pixel) {
    const dbObject = this.toDatabaseDTO(pixel);
    return await this.database.insert(this.tableName, dbObject);
  }

  async saveInBulk(pixels, chunkSize = 500) {
    let data = pixels.map((pixel) => toDatabaseDTO(pixel))
    let dataChunks = _.chunk(data, chunkSize)
    for (let chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk)
    }
  }

  async upsert(pixels, adAccountsMap, chunkSize = 500) {
    const dbObjects = pixels.map((pixel) => this.toDatabaseDTO(pixel, adAccountsMap));
    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, "pixel_id_ad_account_id");
    }
  }

  async fetchPixels(fields = ['*'], filters = {}, limit) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results;
  }

  toDatabaseDTO(pixel, adAccountsMap) {
    return {
      pixel_id: pixel.id,
      user_id: adAccountsMap[pixel.ad_account_id].user_id,
      account_id: adAccountsMap[pixel.ad_account_id].account_id,
      name: pixel.name,
      business_id: pixel?.owner_business.id || null,
      business_name: pixel?.owner_business.name || null,
      is_unavailable: pixel.is_unavailable,
      last_fired_time: pixel.last_fired_time,
      creation_time: pixel.creation_time,
      data_use_setting: pixel.data_use_setting,
      pixel_id_ad_account_id: pixel.id + "_" + pixel.ad_account_id
    }
  }

  toDomainEntity(dbObject) {
    return new Pixel(
      dbObject.id,
      dbObject.user_id,
      dbObject.account_id,
      dbObject.name,
      dbObject.business_id,
      dbObject.business_name,
      dbObject.is_unavailable,
      dbObject.last_fired_time,
      dbObject.creation_time,
      dbObject.data_use_setting,
      pixel_id_ad_account_id
    );
  }

}

module.exports = PixelRepository;
