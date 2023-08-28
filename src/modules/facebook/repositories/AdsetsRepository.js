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
    let data = adsets.map((adset) => toDatabaseDTO(adset))
    let dataChunks = _.chunk(data, chunkSize)
    for (let chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk)
    }
  }

  async upsert(adsets, adAccountsMap, chunkSize = 500) {
    const dbObjects = adsets.map((adset) => this.toDatabaseDTO(adset, adAccountsMap));
    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, "provider_id");
    }
  }

  async fetchAdsets(fields = ['*'], filters = {}, limit) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results;
  }

  toDatabaseDTO(adset, adAccountsMap) {
    return {
      name: adset.name,
      created_time: adset.created_time,
      updated_time: adset.updated_time,
      traffic_source: "facebook",
      provider_id: adset.id,
      status: adset.status,
      campaign_id: adset.campaign_id,
      user_id: adAccountsMap[adset.account_id].user_id, // This is questionable
      account_id: adAccountsMap[adset.account_id].account_id,
      ad_account_id: adAccountsMap[adset.account_id].id, // This is questionable
      daily_budget: adset.daily_budget,
      lifetime_budget: adset.lifetime_budget,
      budget_remaining: adset.budget_remaining,
      network: 'unknown'
    }
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
