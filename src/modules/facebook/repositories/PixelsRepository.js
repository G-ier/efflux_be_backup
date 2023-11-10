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

  async fetchPixels(fields = ['*'], filters = {}, limit) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results;
  }

  async upsert(pixels, adAccountsMap, chunkSize = 500) {
    const dbObjects = pixels.map((pixel) => this.toDatabaseDTO(pixel, adAccountsMap));
    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, "pixel_id_ad_account_id");
    }
  }

  async update(updateFields, criterion) {
    return await this.database.update(this.tableName, updateFields, criterion);
  }

  async delete(criterion) {
    return await this.database.delete(this.tableName, criterion);
  }

  toDatabaseDTO(pixel, adAccountsMap) {
    return {
      pixel_id: pixel.id || pixel.pixel_id,
      domain: pixel.domain || "",
      token: pixel.token || "",
      bm: pixel.bm || "",
      name: pixel.name,
      user_id: pixel.user_id ? pixel.user_id: adAccountsMap ? adAccountsMap[pixel.ad_account_id]?.user_id : null,
      account_id: adAccountsMap ? adAccountsMap[pixel.ad_account_id].account_id : null,
      business_id: pixel?.owner_business?.id || null,
      business_name: pixel?.owner_business?.name || null,
      is_unavailable: pixel.is_unavailable,
      last_fired_time: pixel.last_fired_time,
      creation_time: pixel.creation_time,
      data_use_setting: pixel.data_use_setting,
      pixel_id_ad_account_id: (pixel.id || pixel.pixel_id) + "_" + pixel.ad_account_id,
      ad_account_id: pixel.ad_account_id
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
      dbObject.pixel_id_ad_account_id,
      dbObject.ad_account_id
    );
  }

}

module.exports = PixelRepository;
