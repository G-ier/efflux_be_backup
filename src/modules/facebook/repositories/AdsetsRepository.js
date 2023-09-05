const _ = require("lodash");
const Adset = require("../entities/Adset");
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");

class AdsetsRepository {
  constructor(database) {
    this.tableName = "adsets";
    this.database = database || new DatabaseRepository();
  }

  async saveOne(adset) {
    const dbObject = this.toDatabaseDTO(adset);
    return await this.database.insert(this.tableName, dbObject);
  }

  async updateOne(adset, criteria) {
    const dbObject = this.toDatabaseDTO(adset);
    return await this.database.update(this.tableName, dbObject, criteria);
  }

  async saveInBulk(adsets, chunkSize = 500) {
    let data = adsets.map((adset) => toDatabaseDTO(adset));
    let dataChunks = _.chunk(data, chunkSize);
    for (let chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk);
    }
  }

  async upsert(adsets, adAccountsMap, chunkSize = 500) {
    const dbObjects = adsets.map((adset) => this.toDatabaseDTO(adset, adAccountsMap));
    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, "provider_id");
    }
  }

  async fetchAdsets(fields = ["*"], filters = {}, limit) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
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

  toDatabaseDTO(adset, adAccountsMap) {
    const adAccountInfo = adAccountsMap?.[adset.account_id] || {};

    let dbObject = this.pickDefinedProperties(adset, [
      "name",
      "created_time",
      "updated_time",
      "id",
      "status",
      "campaign_id",
      "daily_budget",
      "lifetime_budget",
      "budget_remaining",
    ]);

    dbObject.traffic_source = "facebook";
    dbObject.provider_id = adset.id;
    dbObject.network = "unknown";

    if (adAccountInfo.user_id !== undefined) {
      dbObject.user_id = adAccountInfo.user_id;
    }

    if (adAccountInfo.account_id !== undefined) {
      dbObject.account_id = adAccountInfo.account_id;
    }

    if (adAccountInfo.id !== undefined) {
      dbObject.ad_account_id = adAccountInfo.id;
    }

    return dbObject;
  }

  toDomainEntity(dbObject) {
    return new Adset(
      dbObject.name,
      dbObject.created_time,
      dbObject.updated_time,
      dbObject.provider_id,
      dbObject.status,
      dbObject.campaign_id,
      dbObject.user_id,
      dbObject.account_id,
      dbObject.ad_account_id,
      dbObject.daily_budget,
      dbObject.lifetime_budget,
      dbObject.budget_remaining,
    );
  }
}

module.exports = AdsetsRepository;
