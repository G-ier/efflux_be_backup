const { getTikTokEndpointData } = require("../helpers");
const { TIKTOK_ADSET_AVAILABLE_FIELDS } = require("../constants");
const AdsetsRepository = require("../repositories/AdsetsRepository");
const { TiktokLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");
const _ = require("lodash");

class AdsetService extends BaseService {
  constructor() {
    super(TiktokLogger);
    this.adsetsRepository = new AdsetsRepository();
  }

  async getTikTokAdsets(access_token, adAccountIds, date) {
    this.logger.info("Fetching Adsets from API");
    const endpoint = "adgroup";
    const additionalParams = {
      fields: JSON.stringify(TIKTOK_ADSET_AVAILABLE_FIELDS),
      creation_filter_start_time: date + " 00:00:00",
    };

    return await getTikTokEndpointData(endpoint, access_token, adAccountIds, additionalParams);
  }

  async syncAdsets(access_token, adAccountIds, adAccountsMap, campaignIds, date) {
    let adsets = await this.getTikTokAdsets(access_token, adAccountIds, date);
    adsets = adsets.filter((adset) => campaignIds.includes(adset.campaign_id));
    this.logger.info(`Upserting ${adsets.length} Adsets`);
    await this.adsetsRepository.upsert(adsets, adAccountsMap, 500);
    this.logger.info(`Done upserting adsets`);
    return adsets.map((adset) => adset.adgroup_id);
  }

  async fetchAdsetsFromDatabase(fields = ["*"], filters = {}, limit) {
    return await this.adsetsRepository.fetchAdsets(fields, filters, limit);
  }

}

module.exports = AdsetService;
