const _ = require("lodash");
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");

class CampaignRepository {

  constructor(database) {
    this.tableName = "network_campaigns";
    this.userAssociationTableName = "network_campaigns_user_relations";
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

  async upsertUserAssociation(network, networkCampaignId, userId) {

    const relation = {
      network,
      network_campaign_id: networkCampaignId,
      user_id: userId
    }

    await this.database.upsert(this.userAssociationTableName, [relation], "user_id, network_campaign_id, network");

    return relation;
  }

  async fetchCampaigns(fields = ["*"], filters = {}, limit) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results;
  }

  toDatabaseDTO(campaign) {
    return {
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      created_at: campaign.created_at,
    };
  }
}

module.exports = CampaignRepository;
