const _ = require('lodash');
const ScrappedAd = require('../entities/ScrappedAd');
const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');


class ScrappedAdsRepository {

  constructor(database) {
    this.tableName = "scrapped_ads";
    this.database = database || new DatabaseRepository();
  }

  async saveOne(scrappedAd, trx = null) {
      const dbObject = this.toDatabaseDTO(scrappedAd);
      return await this.database.insert(this.tableName, dbObject, trx);
  }

  async saveInBulk(scrappedAds, chunkSize = 500) {
    let data = scrappedAds.map((scrappedAd) => toDatabaseDTO(scrappedAd))
    let dataChunks = _.chunk(data, chunkSize)
    for (let chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk)
    }
  }

  async updateOne (scrappedAd, scrappedAdId) {
    const dbObject = this.toDatabaseDTO(scrappedAd);
    return await this.database.update(this.tableName, dbObject, {id: scrappedAdId});
  }

  async fetchScrappedAds(fields = ['*'], filters = {}, limit) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results;
  }

  async deleteById(scrappedAdId, trx = null) {
    return await this.database.delete(this.tableName, { id: scrappedAdId }, trx);
  }

  toDatabaseDTO(scrappedAd) {
    return {
      ad_archive_id: scrappedAd.ad_archive_id,
      primary_text: scrappedAd.primary_text,
      publisher_identifier: scrappedAd.publisher_identifier,
      publisher_type: scrappedAd.publisher_type,
      publisher_name: scrappedAd.publisher_name,
      starting_date: scrappedAd.starting_date,
      status: scrappedAd.status,
      keywords: scrappedAd.keywords,
      link: scrappedAd.link,
      landing_url: scrappedAd.landing_url,
      network: scrappedAd.network,
      cta: scrappedAd.cta,
    }
  }

  toDomainEntity(dbObject) {
    return new ScrappedAd(
      dbObject.id,
      dbObject.created_at,
      dbObject.updated_at,
      dbObject.ad_archive_id,
      dbObject.primary_text,
      dbObject.publisher_identifier,
      dbObject.publisher_type,
      dbObject.publisher_name,
      dbObject.starting_date,
      dbObject.status,
      dbObject.keywords,
      dbObject.link,
      dbObject.landing_url,
      dbObject.network,
      dbObject.cta,
    );
  }

}

module.exports = ScrappedAdsRepository;
