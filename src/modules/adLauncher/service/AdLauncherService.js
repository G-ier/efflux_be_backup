const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");

class AdLauncherService {
  constructor() {
    this.database = new DatabaseRepository();
  }

  async submitAdToFacebook(type, adAccountId, imageBuffer) {
    // TODO: Implement this method
    console.log(`Submit Add to Facebook`);
  }

  async storeDataInRds(data) {}

  async getTonicCampaigns() {
    // make query to get all campaigns from tonic
    const result = await this.database.query(
      "tonic_campaigns",
      ["id", "name", "country", "target as domain"],
      500
    );
    return result;
  }
}

module.exports = AdLauncherService;
