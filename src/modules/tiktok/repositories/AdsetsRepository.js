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
      await this.database.upsert(this.tableName, chunk, "provider_id, traffic_source");
    }
    return dbObjects;
  }

  async fetchAdsets(fields = ["*"], filters = {}, limit, joins = []) {
    const results = await this.database.query(this.tableName, fields, filters, limit, joins);
    return results;
  }

  async updateOne(adset, criteria) {
    const data = this.toDatabaseDTO(adset)
    const dbObject = Object.keys(data).reduce((acc, key) => {
      if (data[key] != null) {  // This will check for both null and undefined
        acc[key] = data[key];
      }
      return acc;
    }, {});

    return await this.database.update(this.tableName, dbObject, criteria);
  }

  toDatabaseDTO(adset, adAccountsMap) {
    return {
      id: adset.adgroup_id,
      name: adset.adgroup_name,
      created_time: adset.create_time,
      updated_time: adset.modify_time,
      traffic_source: "tiktok",
      campaign_id: adset.campaign_id,
      provider_id: adset.adgroup_id,
      status: adset.status || adset.operation_status,
      user_id: adAccountsMap?.[adset.advertiser_id].user_id,
      account_id: adAccountsMap?.[adset.advertiser_id].account_id,
      ad_account_id: adAccountsMap?.[adset.advertiser_id].id,
      daily_budget: adset.dailyBudget || adset.budget,
      lifetime_budget: adset.lifetime_budget,
      budget_remaining: adset.budget_remaining,
      network: "unknown",
    };
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
      dbObject.budget_remaining
    );
  }
}

module.exports = AdsetsRepository;
