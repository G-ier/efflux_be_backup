// Third Party Imports
const _                           = require("lodash");

// Local Imports
const DatabaseRepository          = require("../../../shared/lib/DatabaseRepository");


class CampaignsRepository {

  constructor() {
    this.tableName = "tonic_campaigns";
    this.database = new DatabaseRepository();
  }

  async fetchCampaignsAccount(campaignId) {
    const joins = [
      {
        type: "inner",
        table: "tonic_accounts",
        first: "tonic_accounts.id",
        second: "tonic_campaigns.tonic_account_id",
        operator: "="
      }
    ]
    const results = await this.database.query(this.tableName, ["tonic_accounts.*"], { "tonic_campaigns.id": campaignId }, null, joins);
    if (results && results.length > 0) {
      return results[0];
    }
    return [];
  }

  async fetchCampaigns(fields = ["*"], filters = {}, limit) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results;
  }

  async upsert(campaigns, tonic_account_id, chunkSize = 500) {
    const dbObjects = campaigns.map((campaign) => this.toDatabaseDTO(campaign, tonic_account_id));
    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, "id");
    }
  }

  toDatabaseDTO(campaign, tonic_account_id) {
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
      target: campaign.target,
      tonic_account_id: tonic_account_id
    }
  }

}

module.exports = CampaignsRepository;
