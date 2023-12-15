// Third Party Imports
const _                           = require("lodash");

// Local Imports
const DatabaseRepository          = require("../../../shared/lib/DatabaseRepository");


class CampaignsRepository {

  constructor() {
    this.tableName = "tonic_campaigns";
    this.database = new DatabaseRepository();
  }

  async fetchCampaigns(fields = ["*"], filters = {}, limit) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results;
  }

  async upsert(campaigns, chunkSize = 500) {
    const dbObjects = campaigns.map((campaign) => this.toDatabaseDTO(campaign));
    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, "id");
    }
  }

  toDatabaseDTO(campaign) {
    return {
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      country: campaign.country,
      imprint: campaign.imprint,
      offer_id: campaign.offer_id,
      offer: campaign.offer,
      vertical: campaign.vertical,
      link: campaign.link,
      target: campaign.target
    }
  }

}

module.exports = CampaignsRepository;
