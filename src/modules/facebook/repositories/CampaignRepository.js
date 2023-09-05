const _ = require("lodash");
const Campaign = require("../entities/Campaign");
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");

class CampaignRepository {
  constructor(database) {
    this.tableName = "campaigns";
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

  async fetchCampaigns(fields = ["*"], filters = {}, limit) {
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

  toDatabaseDTO(campaign, adAccountsMap) {
    const adAccountInfo = adAccountsMap?.[campaign.account_id] || {};

    const dbObject = this.pickDefinedProperties(campaign, [
      "id",
      "name",
      "status",
      "daily_budget",
      "lifetime_budget",
      "created_time",
      "budget_remaining",
      "updated_time",
    ]);

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
    return new Campaign(
      dbObject.name,
      dbObject.created_time,
      dbObject.updated_time,
      dbObject.id,
      dbObject.status,
      dbObject.user_id,
      dbObject.account_id,
      dbObject.ad_account_id,
      dbObject.daily_budget,
      dbObject.lifetime_budget,
      dbObject.budget_remaining,
    );
  }
}

module.exports = CampaignRepository;
