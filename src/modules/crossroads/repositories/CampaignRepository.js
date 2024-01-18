const _ = require("lodash");
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");
const Campaign = require("../entities/Campaign");

class CampaignRepository {
  constructor(database) {
    this.tableName = "crossroads_campaigns";
    this.database = database || new DatabaseRepository();
  }

  async saveOne(campaign) {
    const dbObject = this.toDatabaseDTO(campaign);
    return await this.database.insert(this.tableName, dbObject);
  }

  async saveInBulk(campaigns, chunkSize = 500) {
    let data = campaigns.map((campaign) => this.toDatabaseDTO(campaign));
    let dataChunks = _.chunk(data, chunkSize);
    for (let chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk);
    }
  }

  async update(data, criteria) {
    return await this.database.update(this.tableName, data, criteria);
  }

  async delete(criteria) {
    return await this.database.delete(this.tableName, criteria);
  }

  async upsert(campaigns, chunkSize = 500) {
    const dbObjects = campaigns.map((campaign) => this.toDatabaseDTO(campaign));
    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, "id");
    }
  }

  async fetchCampaigns(fields = ["*"], filters = {}, limit) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results.map(this.toDomainEntity);
  }

  toDatabaseDTO(campaign) {
    return {
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      created_at: campaign.created_at,
    };
  }

  toDomainEntity(dbObject) {
    return new Campaign(
      dbObject.id,
      dbObject.name,
      dbObject.vertical,
      dbObject.category,
      dbObject.type,
      dbObject.user_id,
      dbObject.account_id,
      dbObject.created_at,
      dbObject.updated_at,
    );
  }
}

module.exports = CampaignRepository;
