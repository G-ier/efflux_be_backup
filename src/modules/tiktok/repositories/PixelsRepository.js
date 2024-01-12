const _ = require('lodash');
const Pixel = require('../entities/Pixel');
const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');

class PixelRepository {
  constructor(database) {
    this.tableName = 'tt_pixels';
    this.database = database || new DatabaseRepository();
  }

  async saveOne(pixel) {
    const dbObject = this.toDatabaseDTO(pixel);
    return await this.database.insert(this.tableName, dbObject);
  }

  async saveInBulk(pixels, chunkSize = 500) {
    let data = pixels.map((pixel) => toDatabaseDTO(pixel));
    let dataChunks = _.chunk(data, chunkSize);
    for (let chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk);
    }
  }

  async fetchPixels(fields = ['*'], filters = {}, limit, joins = []) {
    const cache = true;
    const results = await this.database.query(this.tableName, fields, filters, limit, joins, cache);
    return results;
  }

  async upsert(pixels, adAccountsMap, chunkSize = 500) {
    const dbObjects = pixels.map((pixel) => this.toDatabaseDTO(pixel, adAccountsMap));
    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, 'id');
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
      id: `${pixel.pixel_id}_${pixel.ad_account_id}_${
        adAccountsMap[pixel.ad_account_id]?.account_id
      }`,
      pixel_id: pixel.pixel_id,
      code: pixel.pixel_code,
      name: pixel.pixel_name,
      creation_time: pixel.create_time,
      category: pixel.pixel_category,
      mode: pixel.pixel_setup_mode,
      status: pixel.activity_status,
      provider_id: pixel.ad_account_id,
      ad_account_id: adAccountsMap[pixel.ad_account_id]?.id,
    };
  }

  toDomainEntity(dbObject) {
    return new Pixel(
      dbObject.id,
      dbObject.pixel_id,
      dbObject.code,
      dbObject.name,
      dbObject.creation_time,
      dbObject.created_at,
      dbObject.updated_at,
      dbObject.category,
      dbObject.mode,
      dbObject.status,
      dbObject.user_id,
      dbObject.account_id,
      dbObject.ad_account_id,
      dbObject.provider_id,
    );
  }
}

module.exports = PixelRepository;
