const DatabaseRepository = require("../../../src/shared/lib/DatabaseRepository");


class RedirectUrlRepository {
  constructor() {
    this.tableName = "redirect_urls";
    this.database = new DatabaseRepository();
  }

  /**
   *
   * @param {} data { source, campaignId, redirectUrl }[]
   * @param {*} chunkSize
   */
  async saveInBulk(data, chunkSize = 500) {
    const dbObjects = data.map((redirectObj) => this.toDatabaseDTO(redirectObj));
    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk);
    }
  }

  async bulkDelete(ids, chunkSize = 500) {
    const dataChunks = _.chunk(ids, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.bulkDelete(this.tableName, chunk);
    }
  }

  // Returns a list containing objects that have source, campaign id and redirect Urls for entries in the table 'redirect_urls'
  async fetchRedirectUrls(fields = ["*"], filters = {}, limit = 500) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results.map(this.toDomainEntity);
  }

  toDatabaseDTO({
    source,
    campaignId,
    redirectUrl
  }) {
    return {
      source: source,
      campaign_id: campaignId,
      redirect_url: redirectUrl
    };
  }

  toDomainEntity(dbObject) {
    return {
      source: dbObject.source,
      campaignId: dbObject.campaign_id,
      redirectUrl: dbObject.redirect_url
    };
  }
}

module.exports = RedirectUrlRepository;
