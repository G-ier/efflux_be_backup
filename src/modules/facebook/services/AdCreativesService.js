// Third party imports
const { ServiceUnavailable } = require("http-errors");
const axios = require("axios");

// Local application imports
const AdCreativeRepository = require("../repositories/AdCreativeRepository");
const { FB_API_URL, creativeFieldsFilter } = require("../constants");

class AdCreativesService {
  constructor() {
    this.adCreativesRepository = new AdCreativeRepository();
  }

  async fetchAdCreativeFromApi(creativeId, token) {
    const url = `${FB_API_URL}${creativeId}?access_token=${token}&fields=${creativeFieldsFilter}`;
    const creative = await axios.get(url).catch((err) => {
      throw new ServiceUnavailable(err.response?.data.error || err);
    });
    return creative.data;
  }

  async fetchAdCreativeById(creativeId) {
    const results = await this.fetchAdCreativesFromDatabase(["*"], { id: creativeId }, 1);
    if (results && results.length > 0) {
      return results[0]; // Return the first (and only) result
    }
    return null; // Return null if no results found
  }

  async deleteAdCreative(creativeId, token) {
    // Delete from Facebook's API
    const url = `${FB_API_URL}${creativeId}?access_token=${token}`;
    await axios.delete(url).catch((err) => {
      console.log(err);
      throw new ServiceUnavailable(err.response?.data.error || err);
    });

    // Delete from the local database
    await this.adCreativesRepository.deleteOne(creativeId);
  }

  async updateAdCreative(creativeId, data) {
    try {
      // Extracting necessary data from the request
      const token = data.access_token;
      const adCreativeData = {
        name: data.params.name,
        object_story_spec: data.params.object_story_spec,
      };

      // Make the API request to Facebook for updating
      const url = `${FB_API_URL}${creativeId}?access_token=${token}`;
      const response = await axios.post(url, adCreativeData).catch((err) => {
        console.log(err);
        throw new ServiceUnavailable(err.response?.data.error || err);
      });
      if (response.data.success) {
        const updatedAdCreative = await this.adCreativesRepository.updateOne(creativeId, adCreativeData);
        return updatedAdCreative;
      }
      return "Failed to update";
    } catch (error) {
      console.error("Error in AdCreativesService:", error);
      throw error;
    }
  }

  async getAdCreative(creativeId) {
    const adCreative = await this.adCreativesRepository.findOne(creativeId);
    if (!adCreative) {
      throw new Error("Ad Creative not found");
    }
    return adCreative;
  }

  async createAdCreative(data) {
    try {
      // Extracting necessary data from the request
      const adAccountId = data.adAccountId;
      const params = {
        name: data.params.name,
        object_story_spec: data.params.object_story_spec,
        degrees_of_freedom_spec: data.params.degrees_of_freedom_spec,
      };

      // Make the API request to Facebook
      const url = `${FB_API_URL}act_${adAccountId}/adcreatives`;
      const creativeResponse = await axios
        .post(url, params, {
          headers: {
            Authorization: `Bearer ${data.params.access_token}`,
          },
        })
        .catch((err) => {
          console.log(err.response.data);
          throw new ServiceUnavailable(err.response?.data.error || err);
        });

      // Combine the data from the API response and the request to create the adCreative object
      const adCreative = {
        ...creativeResponse.data,
        ...data.params,
        adAccountId,
      };

      // Transform the adCreative object to fit the database schema and save to the database
      console.log(adCreative);
      const result = await this.adCreativesRepository.saveOne(adCreative);
      return result;
    } catch (error) {
      console.error("Error in AdCreativesService:", error);
      throw error;
    }
  }

  async syncAdCreatives(adAccountId, token) {
    const apiAdCreatives = await this.fetchAdCreativeFromApi(adAccountId, token);
    await this.adCreativesRepository.upsert(apiAdCreatives);
    return apiAdCreatives.map((creative) => creative.id);
  }

  async fetchAdCreativesFromDatabase(fields = ["*"], filters = {}, limit) {
    const results = await this.adCreativesRepository.fetchAdCreatives(fields, filters, limit);
    return results;
  }
}

module.exports = AdCreativesService;
