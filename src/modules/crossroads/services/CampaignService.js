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
    return this.repository.fetchCampaigns(); // Fetch all campaigns without any filters or limits
  }

  async deleteCampaignById(id) {
    return this.repository.delete({ id });
  }

  async postCampaign(body) {
    const {
      key,
      ...rest
    } = body;
    const url = `${CROSSROADS_URL}campaign-wizard/create?api_key=${key}`;
    const { data } = await axios.post(url, { ...rest });
    return data;
  }

  async postDomainLookUp(key, domain, tld) {
    const url = `${CROSSROADS_URL}campaign-wizard/domain-lookup?api_key=${key}`;
    const { data } = await axios.post(url, { domain, tld })
    return data;
  }

  async postVerifyDomainAvailability(key, domain) {
    const url = `${CROSSROADS_URL}campaign-wizard/verify-domain-availability?api_key=${key}`;
    const { data } = await axios.post(url, { domain })
    return data;
  }

  async getMetadata(key) {
    const url = `${CROSSROADS_URL}campaign-wizard?api_key=${key}`;
    const { data } = await axios.get(url);
    return data;
  }
}

module.exports = CampaignService;
