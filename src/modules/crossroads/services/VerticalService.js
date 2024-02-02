const axios = require('axios');
const VerticalRepository = require('../repositories/VerticalRepository');
const { CROSSROADS_URL, CROSSROADS_ACCOUNTS } = require('../constants');
const { CrossroadsLogger } = require('../../../shared/lib/WinstonLogger');
const BaseService = require('../../../shared/services/BaseService');

class VerticalService extends BaseService {
  constructor() {
    super(CrossroadsLogger);
    this.repository = new VerticalRepository();
  }

  async syncVerticalsFromCrossroads() {
    CrossroadsLogger.info('Syncing verticals from Crossroads');
    try {
      for (const account of CROSSROADS_ACCOUNTS) {
        const response = await axios.get(
          `${CROSSROADS_URL}/campaign-wizard?api_key=${account.key}`,
        );
        const verticals = response.data.categories;
        const verticalsProcessed = verticals.map((vertical) => ({
          name: vertical.name,
          provider_id: vertical.id, // Set 'provider_id' to the value of 'id'
          provider: 'da', // Set 'provider' to 'da'
        }));

        CrossroadsLogger.info('Received verticals data from Crossroads');

        await this.repository.upsert(verticalsProcessed);

        CrossroadsLogger.info('Successfully synced verticals with local database');
      }
    } catch (error) {
      CrossroadsLogger.error('Error syncing verticals from Crossroads', error);
      throw error; // Rethrow the error so the controller can catch it and handle the response
    }
  }

  async getAllVerticals() {
    try{
      return this.repository.fetchVerticals(); // Fetch all verticals without any filters or limits
    }
    catch(error){
      throw error
    }
  }

  async getVerticalById(id) {
    const filters = { id };
    const results = await this.repository.fetchVerticals(['*'], filters, 1);
    return results.length ? results[0] : null; // Return null if no results are found
  }

  async deleteVerticalById(id) {
    return this.repository.deleteVerticalById(id);
  }
}

module.exports = VerticalService;
