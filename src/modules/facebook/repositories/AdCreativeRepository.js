const _ = require("lodash");
const AdCreatives = require("../entities/AdCreatives");
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");

class AdCreativeRepository {
  constructor(database) {
    this.tableName = "adlinks";
    this.database = database || new DatabaseRepository();
  }

  async saveOne(adCreative) {
    const dbObject = this.toDatabaseDTO(adCreative);
    return await this.database.insert(this.tableName, dbObject);
  }

  async deleteOne(creativeId) {
    return await this.database.delete(this.tableName, { id: creativeId });
  }

  async updateOne(creativeId, adCreativeData) {
    const dbObject = this.toDatabaseDTO(adCreativeData);
    return await this.database.update(this.tableName, dbObject, { id: creativeId });
  }

  async findOne(creativeId) {
    const result = await this.database.query(this.tableName, ["*"], { id: creativeId }, 1);
    if (result.length === 0) {
      return null;
    }
    return this.toDomainEntity(result[0]);
  }

  async saveInBulk(adCreatives, chunkSize = 500) {
    let data = adCreatives.map((adCreative) => this.toDatabaseDTO(adCreative));
    let dataChunks = _.chunk(data, chunkSize);
    for (let chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk);
    }
  }

  async upsert(adCreatives, chunkSize = 500) {
    const dbObjects = adCreatives.map((adCreative) => this.toDatabaseDTO(adCreative));
    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, "id"); // Assuming "id" is the unique identifier for upsert
    }
    return dbObjects;
  }

  async fetchAdCreatives(fields = ["*"], filters = {}, limit) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results.map((result) => this.toDomainEntity(result));
  }

  toDatabaseDTO(adCreative) {
    let dbObject = {};

    if (adCreative.id) dbObject.id = adCreative.id;
    if (adCreative.adAccountId) dbObject.adaccountid = adCreative.adAccountId;
    if (adCreative.name) dbObject.name = adCreative.name;
    if (adCreative?.object_story_spec?.link_data?.message)
      dbObject.description = adCreative.object_story_spec.link_data.message;
    if (adCreative?.object_story_spec?.link_data?.link)
      dbObject.media_url = adCreative.object_story_spec.link_data.link;
    if (adCreative?.object_story_spec?.link_data?.call_to_action?.type)
      dbObject.call_to_action = adCreative.object_story_spec.link_data.call_to_action.type;

    // Set media_type
    dbObject.media_type = "link";

    // Only set created_at if it's a new record
    if (!adCreative.id) {
      dbObject.created_at = new Date();
    }

    // Set updated_at timestamp whenever updating
    dbObject.updated_at = new Date();

    return dbObject;
  }

  toDomainEntity(dbObject) {
    return new AdCreatives(
      dbObject.id,
      dbObject.name,
      dbObject.description,
      dbObject.media_type,
      dbObject.media_url,
      dbObject.call_to_action,
      dbObject.campaign_id,
      dbObject.adset_id,
      dbObject.created_at,
      dbObject.updated_at
    );
  }
}

module.exports = AdCreativeRepository;
