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

  async syncVerticalsFromCrossroads(req, res) {
    CrossroadsLogger.info('Syncing verticals from Crossroads');

    try {
        for (const account of CROSSROADS_ACCOUNTS) {
        
        const response = await axios.get(
            `${CROSSROADS_URL}/campaign-wizard?api_key=${account.key}`,
        );
        const verticals = response.data.categories;
        const verticalsProcessed = verticals.map(vertical => ({
            name: vertical.name,
            provider_id: vertical.id, // Set 'provider_id' to the value of 'id'
            provider: 'da', // Set 'provider' to 'da'
        }));

        CrossroadsLogger.info('Received verticals data from Crossroads');

        await this.repository.upsert(verticalsProcessed);

        CrossroadsLogger.info('Successfully synced verticals with local database');

    }
        res.json({ message: 'Verticals synced successfully.' });
    } catch (error) {
        CrossroadsLogger.error('Error syncing verticals from Crossroads', error);
        res.status(500).json({ error: 'Failed to sync verticals from Crossroads.' });
    }
}


async getAllVerticals(req, res) {
  try {
    const verticals = await this.repository.fetchVerticals(); // Attempt to fetch all verticals
    if (!verticals) {
      // If no verticals are found, send a 404 Not Found response
      return res.status(404).send({ message: "Verticals not found." });
    }
    // If verticals are found, send a 200 OK response with the verticals data
    return res.status(200).json(verticals);
  } catch (error) {
    // If an error occurs, log it and send a 500 Internal Server Error response
    console.error('Failed to fetch verticals:', error);
    return res.status(500).send({ message: "Failed to fetch verticals." });
  }
}


async getVerticalById(req, res) {
  try {
    const { id } = req.params; // Extract the ID from the request parameters
    const filters = { id }; // Assuming the column name for the ID is 'id'
    const results = await this.repository.fetchVerticals(['*'], filters, 1);

    if (results.length === 0) {
      // No vertical found with the given ID
      return res.status(404).json({ message: "Vertical not found." });
    }

    // Vertical found, return the first result
    return res.status(200).json(results[0]);
  } catch (error) {
    // Log the error and return a 500 Internal Server Error response
    CrossroadsLogger.error(`Failed to fetch vertical with ID ${req.params.id}:`, error);
    return res.status(500).json({ message: "Failed to fetch vertical." });
  }
}


  async deleteVerticalById(id) {
    return this.repository.delete({ id });
  }
}

module.exports = VerticalService;
