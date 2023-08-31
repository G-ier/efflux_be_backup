const { getTikTokEndpointData } = require("../helpers");
const { TIKTOK_ADSET_AVAILABLE_FIELDS } = require("../constants");
const AdsetsRepository = require("../repositories/AdsetsRepository");
const _ = require("lodash");

class AdsetService {
  constructor() {
    this.adsetsRepository = new AdsetsRepository();
  }

  async getTikTokAdsets(access_token, adAccountIds, date) {
    const endpoint = "adgroup";
    const additionalParams = {
      fields: JSON.stringify(TIKTOK_ADSET_AVAILABLE_FIELDS),
      creation_filter_start_time: date + " 00:00:00",
    };

    return await getTikTokEndpointData(endpoint, access_token, adAccountIds, additionalParams);
  }

  async syncAdsets(access_token, adAccountIds, adAccountsMap, date) {
    const adsets = await this.getTikTokAdsets(access_token, adAccountIds, date);
    await this.adsetsRepository.upsert(adsets, adAccountsMap, 500);
    return adsets.map((adset) => adset.adgroup_id);
  }

  async fetchAdsetsFromDatabase(fields = ["*"], filters = {}, limit) {
    return await this.adsetsRepository.fetchAdsets(fields, filters, limit);
  }

}

module.exports = AdsetService;
