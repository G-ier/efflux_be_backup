const _ = require("lodash");
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");
const CampaignMetadata = require("../entities/CampaignMetadata");

class CampaignMetaDataRepository {
  constructor(database) {
    this.tableName = "campaign_metadata";
    this.database = database || new DatabaseRepository();
  }

  async saveOne(campaign) {
    const dbObject = this.toDatabaseDTO(campaign);
    return await this.database.insert(this.tableName, dbObject);
  }

  async updateOne(adset, criteria) {
    const dbObject = this.toDatabaseDTO(adset);
    return await this.database.update(this.tableName, dbObject, criteria);
  }

  async saveInBulk(campaigns, chunkSize = 500) {
    let data = campaigns.map((campaign) => toDatabaseDTO(campaign));
    let dataChunks = _.chunk(data, chunkSize);
    for (let chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk);
    }
  }

  async upsert(campaigns, adAccountsMap, chunkSize = 500) {
    const dbObjects = campaigns.map((campaign) => this.toDatabaseDTO(campaign, adAccountsMap));
    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, "id");
    }
  }

  async update(updateFields, criterion) {
    return await this.database.update(this.tableName, updateFields, criterion);
  }

  async fetchCampaignMetadata(fields = ["*"], filters = {}, limit, joins = []) {
    const results = await this.database.query(this.tableName, fields, filters, limit, joins);
    return results;
  }

  pickDefinedProperties(obj, keys) {
    return keys.reduce((acc, key) => {
      if (obj[key] !== undefined) {
        acc[key] = obj[key];
      }
      return acc;
    }, {});
  }

  toDatabaseDTO(campaign) {
    const dbObject = this.pickDefinedProperties(campaign, [
      "id",
      "name",
      "objective",
      "special_ad_category",
      "special_ad_category_country",
    ]);

    return dbObject;
  }

  toDomainEntity(dbObject) {
    return new CampaignMetadata(
      // Fields from campaignData
      (name = dbObject.name),
      (objective = dbObject.objective),
      (special_ad_category = JSON.stringify(dbObject.special_ad_category)),
      (special_ad_category_country = dbObject.special_ad_category_country),
    );
  }
}

module.exports = CampaignMetaDataRepository;
