const _ = require("lodash");
const AdsRepository = require("../repositories/AdsRepository");
const { TIKTOK_AD_FIELDS } = require("../constants");
const { getTikTokEndpointData } = require("../helpers");

class AdsService {

  constructor() {
    this.tikTokAdRepository = new AdsRepository();
  }

  async getTikTokAdsFromAPI(access_token, adAccountIds, date) {
    return getTikTokEndpointData("ad", access_token, adAccountIds, {
      fields: JSON.stringify(TIKTOK_AD_FIELDS),
      creation_filter_start_time: date + " 00:00:00",
    });
  }

  async syncAds(access_token, adAccountIds, adAccountsMap, date) {
    const ads = await this.getTikTokAdsFromAPI(access_token, adAccountIds, date);
    await this.tikTokAdRepository.upsert(ads, adAccountsMap, 500);
    return ads.map((ad) => ad.ad_id);
  }

  async fetchAds(fields = ["*"], filters = {}, limit) {
    const results = await this.tikTokAdRepository.fetchAds(fields, filters, limit);
    return results.map(this.toDomainEntity);
  }

}

module.exports = AdsService;
