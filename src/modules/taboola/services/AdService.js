// Third party imports
const axios = require("axios");
const async = require("async");
_ = require("lodash");

// Local application imports
const AdRepository = require("../repositories/AdRepository");
const { TABOOLA_URL } = require("../constants");
const { TaboolaLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");
const { forEach } = require("lodash");
// const UserAccountService = require("./UserAccountService");
// const AdAccountService = require("./AdAccountsService");

class AdService extends BaseService {

  constructor() {
    super(TaboolaLogger);
    this.adRepository = new AdRepository();
    // this.adAccountService = new AdAccountService();
    // this.userAccountsService = new UserAccountService();
  }

  async getTaboolaAdsFromAPI(access_token, campaigns) {
    this.logger.info("Fetching Ads from API");
    const results = { sucess: [], error: [] };
    const headers = {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    };
    const allAds = await async.mapLimit(campaigns, 100, async (campaign) => {
        let paging = {};
        const ads = [];
        const url = `${TABOOLA_URL}/api/1.0/${campaign.adAccountId}/campaigns/${campaign.campaignId}/items/`;
        do {
          if (paging?.next) {
            url = paging.next;
            params = {};
          }
          const { data = [] } = await axios
            .get(url, {
              headers,
            }, )
            .catch((err) => {
              results.error.push(campaign);
              return {};
            });
          results.sucess.push(campaign);
          paging = { ...data?.paging };
          if (data?.results?.length) {
            const modifiedAds = data.results.map(ad => ({
              ...ad,  // Copy existing properties
              account_id: campaign.adAccountId,  
            }));
          
            ads.push(...modifiedAds);
          }
          
        } while (paging?.next); 
        return ads;
      });
      if (results.sucess.length === 0) throw new Error("All campaigns failed to fetch ads");
      this.logger.info(
        `Campaigns ad Fetching Telemetry: SUCCESS(${results.sucess.length}) | ERROR(${results.error.length})`,
      );
      return _.flatten(allAds);
  }

  async syncAds(access_token, campaigns) {
    const ads = await this.getTaboolaAdsFromAPI(access_token, campaigns);
    this.logger.info(`Upserting ${ads.length} Ads`);
    await this.adRepository.upsert(ads, 500);
    this.logger.info(`Done upserting ads`);
    return ads.map((ad) => ad.ad_id);
  }

  async fetchAds(fields = ["*"], filters = {}, limit) {
    const results = await this.adRepository.fetchAds(fields, filters, limit);
    return results.map(this.toDomainEntity);
  }

}

module.exports = AdService;
