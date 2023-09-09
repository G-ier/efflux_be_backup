const CampaignRepository = require("../repositories/CampaignRepository");
const axios = require("axios");
const { CROSSROADS_URL } = require("../constants");

class CampaignService {
  constructor() {
    this.repository = new CampaignRepository();
  }

  async getCrossroadsCampaigns(key) {
    const { data } = await axios.get(`${CROSSROADS_URL}get-campaigns?key=${key}`);
    return data.campaigns;
  }

  async updateCampaigns(key) {
    const campaigns = await this.getCrossroadsCampaigns(key);
    return await this.repository.upsert(campaigns);
  }

  async fetchCampaignsFromAPI(apiKey) {
    const { data } = await axios.get(`${CROSSROADS_URL}get-campaigns?key=${apiKey}`);
    return data.campaigns;
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
