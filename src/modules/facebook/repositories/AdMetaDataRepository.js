const _ = require("lodash");
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");
const AdMetadata = require("../entities/AdMetadata");

class AdMetaDataRepository {
  constructor(database) {
    this.tableName = "ad_metadata";
    this.database = database || new DatabaseRepository();
  }

  toDatabaseDTO(adMetadata) {
    return {
      id: adMetadata.id,
      name: adMetadata.name,
      status: adMetadata.status,
      creative_name: adMetadata.creative_name,
      page_id: adMetadata.page_id,
      asset_feed_spec: JSON.stringify(adMetadata.asset_feed_spec),
      ad_id: adMetadata.ad_id,
      created_at: adMetadata.created_at,
      updated_at: adMetadata.updated_at
    };
  }

  toDomainEntity(dbObject) {
    return new AdMetadata(
      dbObject.id,
      dbObject.name,
      dbObject.status,
      dbObject.creative_name,
      dbObject.page_id,
      dbObject.asset_feed_spec ? JSON.parse(dbObject.asset_feed_spec) : {},
      dbObject.ad_id,
      dbObject.created_at,
      dbObject.updated_at
    );
  }

  async saveOne(adset) {
    const dbObject = this.toDatabaseDTO(adset);
    return await this.database.insert(this.tableName, dbObject);
  }

  async saveInBulk(adQueues, chunkSize = 500) {
    let data = adQueues.map((adQueue) => this.toDatabaseDTO(adQueue));
    let dataChunks = _.chunk(data, chunkSize);
    for (let chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk);
    }
  }

  async updateOne(adQueue, criteria) {
    const data = this.toDatabaseDTO(adQueue);
    const dbObject = Object.keys(data).reduce((acc, key) => {
      if (data[key] != null) {
        acc[key] = data[key];
      }
      return acc;
    }, {});
    return await this.database.update(this.tableName, dbObject, criteria);
  }

  async fetchAdMetadata(fields = ["*"], filters = {}, limit, joins=[]) {
    const results = await this.database.query(this.tableName, fields, filters, limit, joins);
    return results;
  }

}

module.exports = AdMetaDataRepository;
