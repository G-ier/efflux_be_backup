const _ = require("lodash");
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");
const AdMetadata = require("../entities/AdMetadata");

class AdMetaDataRepository {
  constructor(database) {
    this.tableName = "ad_metadata";
    this.database = database || new DatabaseRepository();
  }
    
  async upsert(adData, adId, adMetadataId, trx) {
    if (!adData) {
      return adMetadataId;
    }
    let adDbObject = this.toDatabaseDTO({
      ...adData,
      ad_id: adId,
      id: adMetadataId // Include ID only if it exists
    });
  
    return await this.database.upsert(
      this.tableName,
      [adDbObject],
      'id',
      [],
      trx
    );
  }

  toDatabaseDTO(adData) {
    // Extracting properties from 'creative' object
    let creativeName = adData.creative?.name;
    let pageId = adData.creative?.object_story_spec?.page_id;
    let assetFeedSpec = adData.creative?.asset_feed_spec;

    // Initialize the database object with required properties
    let databaseDTO = {
        name: adData.name,
        status: adData.status,
        creative_name: creativeName || adData.name,
        page_id: pageId || adData.pageId,
        asset_feed_spec: JSON.stringify(assetFeedSpec),
        ad_id: adData.ad_id,
    };

    // Add 'id' to the object if it exists
    if (adData.id) {
        databaseDTO.id = adData.id;
    }

    return databaseDTO;
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
