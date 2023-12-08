const _ = require("lodash");
const Ad = require("../entities/Ad");
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");

class AdRepository {
  constructor(database) {
    this.tableName = "taboola_ads";
    this.database = database || new DatabaseRepository();
  }

  async saveOne(ad) {
    const dbObject = this.toDatabaseDTO(ad);
    return await this.database.insert(this.tableName, dbObject);
  }

  async saveInBulk(ads, chunkSize = 500) {
    let data = ads.map((ad) => this.toDatabaseDTO(ad));
    let dataChunks = _.chunk(data, chunkSize);
    for (let chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk);
    }
  }

  async upsert(ads, chunkSize = 500) {
    const dbObjects = ads.map((ad) => this.toDatabaseDTO(ad));
    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, "id");
    }
  }

  async fetchAds(fields = ["*"], filters = {}, limit) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results.map(this.toDomainEntity);
  }

  toDatabaseDTO(ad) {
    return {
      id: ad.id,
      title: ad.title,
      description: ad.description,
      status: ad.status,
      url: ad.url,
      thumbnail_url: ad.thumbnail_url,
      campaign_id: ad.campaign_id,
      account_id: ad.account_id,
    };
  }

  toDomainEntity(dbObject) {
    return new Ad(
      dbObject.id,
      dbObject.title,
      dbObject.description,
      dbObject.url,
      dbObject.thumbnail_url,
      dbObject.status,
      dbObject.user_id,
      dbObject.account_id,
      dbObject.campaign_id
    );
  }
}

module.exports = AdRepository;
