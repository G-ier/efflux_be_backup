const _ = require('lodash');
const Creative = require('../entities/Creative');
const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');

class CreativesRepository {

  constructor(database) {
    this.tableName = "creatives";
    this.database = database || new DatabaseRepository();
  }

  async saveOne(creative, trx = null) {
      const dbObject = this.toDatabaseDTO(creative);
      return await this.database.insert(this.tableName, dbObject, trx);
  }

  async saveInBulk(creatives, chunkSize = 500) {
    let data = creatives.map((creative) => toDatabaseDTO(creative))
    let dataChunks = _.chunk(data, chunkSize)
    for (let chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk)
    }
  }

  async updateOne (creative, creativeId) {
    const dbObject = this.toDatabaseDTO(creative);
    return await this.database.update(this.tableName, dbObject, {id: creativeId});
  }

  async fetchCreatives(fields = ['*'], filters = {}, limit) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results;
  }

  async deleteById(creativeId) {
    return await this.database.delete(this.tableName, {
      id: creativeId
    });
  }

  async deleteByCardId(adCardId, trx = null) {
    return await this.database.delete(this.tableName, { ad_card_id: adCardId }, trx);
  }


  toDatabaseDTO(creative) {
    return {
      cdn_url: creative.cdn_url,
      creative_url: creative.creative_url,
      creative_type: creative.creative_type,
      ad_card_id: creative.ad_card_id,
      tags: creative.tags,
    }
  }

  toDomainEntity(dbObject) {
    return new Creative(
      dbObject.id,
      dbObject.cdn_url,
      dbObject.creative_url,
      dbObject.creative_type,
      dbObject.ad_card_id,
      dbObject.tags,
    );
  }

}

module.exports = CreativesRepository;
