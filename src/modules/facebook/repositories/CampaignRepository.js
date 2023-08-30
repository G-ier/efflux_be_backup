const _ = require("lodash");
const Campaign = require('../entities/Campaign');
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

  async saveInBulk(campaigns, chunkSize = 500) {
    let data = campaigns.map((campaign) => toDatabaseDTO(campaign))
    let dataChunks = _.chunk(data, chunkSize)
    for (let chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk)
    }
  }

  async upsert(campaigns, adAccountsMap, chunkSize = 500) {
    const dbObjects = campaigns.map((campaign) => this.toDatabaseDTO(campaign, adAccountsMap));
    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, "id");
    }
  }

  async fetchCampaigns(fields = ['*'], filters = {}, limit) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results;
  }

  toDatabaseDTO(campaign, adAccountsMap) {
    return {
      name: campaign.name,
      created_time: campaign.created_time,
      updated_time: campaign.updated_time,
      id: campaign.id,
      status: campaign.status,
      user_id: adAccountsMap[campaign.account_id].user_id,
      account_id: adAccountsMap[campaign.account_id].account_id,
      ad_account_id: adAccountsMap[campaign.account_id].id,
      daily_budget: campaign.daily_budget,
      lifetime_budget: campaign.lifetime_budget,
      budget_remaining: campaign.budget_remaining,
      network: 'unknown'
    }
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
    )
  }
}

module.exports = CampaignRepository;
