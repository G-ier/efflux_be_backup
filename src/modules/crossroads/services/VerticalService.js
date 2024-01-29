const axios = require("axios");
const VerticalRepository = require("../repositories/VerticalRepository");
const { CROSSROADS_URL, CROSSROADS_API_KEY } = require("../constants");
const { CrossroadsLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");

class VerticalService extends BaseService {

  constructor() {
    super(CrossroadsLogger);
    this.repository = new VerticalRepository();
  }

  async syncVerticalsFromCrossroads() {
    CrossroadsLogger.info("Syncing verticals from Crossroads");

    try {
      const response = await axios.get(`${CROSSROADS_URL}api/v2/campaign-wizard?api_key=${CROSSROADS_API_KEY}`);
      const verticals = response.data.categories;

      CrossroadsLogger.info("Received verticals data from Crossroads");

      for (const vertical of verticals) {
        await this.repository.upsert([vertical], 'id');
      }

      CrossroadsLogger.info("Successfully synced verticals with local database");
    } catch (error) {
      CrossroadsLogger.error("Error syncing verticals from Crossroads", error);
      throw error;
    }
  }

  async getAllVerticals() {
    return this.repository.fetchVerticals(); // Fetch all verticals without any filters or limits
  }

  async getVerticalById(id) {
    const filters = { id }; // Assuming the column name for the ID is 'id'
    const results = await this.repository.fetchVerticals(["*"], filters, 1);
    return results[0]; // Since we expect only one record with the given ID, we return the first result
  }

  async deleteVerticalById(id) {
    return this.repository.delete({ id });
  }

}

module.exports = VerticalService;
