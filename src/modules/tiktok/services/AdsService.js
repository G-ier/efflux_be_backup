const _ = require("lodash");
const AdsRepository = require("../repositories/AdsRepository");
const { TIKTOK_AD_FIELDS } = require("../constants");
const { TiktokLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");
const { getTikTokEndpointData } = require("../helpers");
const UserAccountService = require("./UserAccountService");
const AdAccountService = require("./AdAccountsService");

class AdsService extends BaseService {

  constructor() {
    super(TiktokLogger);
    this.tikTokAdRepository = new AdsRepository();
    this.adAccountService = new AdAccountService();
    this.userAccountsService = new UserAccountService();
  }

  async getTikTokAdsFromAPI(access_token, adAccountIds, date, endDate) {
    this.logger.info("Fetching Ads from API");
    return getTikTokEndpointData("ad", access_token, adAccountIds, {
      fields: JSON.stringify(TIKTOK_AD_FIELDS),
      creation_filter_start_time: date + " 00:00:00",
      creation_filter_end_time: endDate === null ? null : endDate + " 23:59:59"
    });
  }

  async syncAds(access_token, adAccountIds, adAccountsMap, date, endDate) {
    const ads = await this.getTikTokAdsFromAPI(access_token, adAccountIds, date, endDate);
    this.logger.info(`Upserting ${ads.length} Ads`);
    await this.tikTokAdRepository.upsert(ads, adAccountsMap, 500);
    this.logger.info(`Done upserting ads`);
    return ads.map((ad) => ad.ad_id);
  }

  async fetchAds(fields = ["*"], filters = {}, limit) {
    const results = await this.tikTokAdRepository.fetchAds(fields, filters, limit);
    return results.map(this.toDomainEntity);
  }

}

module.exports = AdsService;
