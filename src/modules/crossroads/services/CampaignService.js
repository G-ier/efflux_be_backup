const CampaignRepository = require("../repositories/CampaignRepository");
const axios = require("axios");
const { CROSSROADS_URL } = require("../constants");
const { CrossroadsLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");

class CampaignService extends BaseService {

  constructor() {
    super(CrossroadsLogger);
    this.repository = new CampaignRepository();
  }

  async getCrossroadsCampaigns(key) {
    CrossroadsLogger.info("Getting campaigns from crossroads api")
    const data = await this.fetchFromApi(`${CROSSROADS_URL}get-campaigns`, { key }, "Error getting campaigns from crossroads api");
    return data.campaigns;
  }

  async updateCampaignById(campaignId, fieldName, newValue) {
    const criteria = { id: campaignId };
    const data = { [fieldName]: newValue };

    try {
      const updatedCampaign = await this.repository.update(data, criteria);
      return updatedCampaign;
    } catch (error) {
      // Handle the error, log it, or throw a custom error as needed
      this.logger.error('Error updating campaign:', error);
    }
  }

  async updateCampaigns(key) {

    const campaigns = await this.getCrossroadsCampaigns(key);
    CrossroadsLogger.info("Upserting crossroads campaigns to the database")
    await this.executeWithLogging(
      () => this.repository.upsert(campaigns),
      "Error processing and upserting bulk data"
    );
    CrossroadsLogger.info("Finished crossroads campaigns update.")
  }

  async getCampaignById(id) {
    const filters = { id }; // Assuming the column name for the ID is 'id'
    const results = await this.repository.fetchCampaigns(["*"], filters, 1);
    return results[0]; // Since we expect only one campaign with the given ID, we return the first result
  }

  async getAllCampaigns() {
    return await this.repository.fetchCampaigns(); // Fetch all campaigns without any filters or limits
  }

  async deleteCampaignById(id) {
    return this.repository.delete({ id });
  }
}

module.exports = CampaignService;
