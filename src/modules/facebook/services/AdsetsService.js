// Third party imports
const axios = require("axios");
const async = require("async");
const _ = require("lodash");

// Local application imports
const AdsetsRepository = require("../repositories/AdsetsRepository");
const { FacebookLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");
const { FB_API_URL } = require("../constants");
const { sendSlackNotification } = require("../../../shared/lib/SlackNotificationService");

class AdsetsService extends BaseService {

  constructor() {
    super(FacebookLogger);
    this.adsetsRepository = new AdsetsRepository();
  }

  async getAdsetsFromApi(access_token, adAccountIds, startDate, endDate, preset = null) {
    this.logger.info(`Fetching Adsets from API`);
    const dateParam = preset ? { date_preset: preset } : { time_range: { since: startDate, until: endDate } };
    const fields =
      "id,account_id,campaign_id,status,name,daily_budget,lifetime_budget,created_time,start_time,stop_time,budget_remaining,updated_time";
    const results = { sucess: [], error: [] };

    const allAdsets = await async.mapLimit(adAccountIds, 100, async (adAccountId) => {
      let paging = {};
      const adsets = [];
      let url = `${FB_API_URL}${adAccountId}/adsets`;
      let params = {
        fields,
        ...dateParam,
        access_token,
        limit: 5000
      }
      do {
        if (paging?.next) {
          url = paging.next;
          params = {};
        }
        const { data = [] } = await axios
          .get(url, {params})
          .catch((err) => {
            results.error.push(adAccountId);
            return {};
          });
        results.sucess.push(adAccountId);
        paging = { ...data?.paging };
        if (data?.data?.length) adsets.push(...data.data);
      } while (paging?.next);
      return adsets;
    });
    if (results.sucess.length === 0) throw new Error("All ad accounts failed to fetch adsets");
    this.logger.info(`Ad Accounts Adsets Fetching Telemetry: SUCCESS(${results.sucess.length}) | ERROR(${results.error.length})`);
    return _.flatten(allAdsets);
  }

  async syncAdsets(access_token, adAccountIds, adAccountsMap, campaignIds, startDate, endDate, preset = null) {
    let adsets = await this.getAdsetsFromApi(access_token, adAccountIds, startDate, endDate, preset = null);
    adsets = adsets.filter((adset) => campaignIds.includes(adset.campaign_id));
    this.logger.info(`Upserting ${adsets.length} adsets`);
    await this.executeWithLogging(
      () => this.adsetsRepository.upsert(adsets, adAccountsMap),
      "Error upserting adsets",
    )
    this.logger.info(`Done upserting adsets`);
    return adsets.map((adset) => adset.id);
  }

  async updateAdset(adset, criteria) {
    try {
      return await this.adsetsRepository.updateOne(adset, criteria);
    } catch (error) {
      console.error("ERROR UPDATING ADSET", error);
      await sendSlackNotification("ERROR UPDATING ADSET. Inspect software if this is a error", error);
      throw error;
    }
  }

  async duplicateAdset({ status_option, rename_options, entity_id, access_token, campaign_id = null }) {
    const url = `${FB_API_URL}${entity_id}/copies`;

    const data = {
      deep_copy: false,
      status_option,
      rename_options,
      access_token,
    };

    try {
      const response = await axios.post(url, data);

      await this.adsetsRepository.duplicateShallowAdsetOnDb(
        response.data?.ad_object_ids?.[0].copied_id,
        entity_id,
        rename_options,
        campaign_id,
      );
      return { successful: true };
    } catch ({ response }) {
      console.log("here", response.data);
      return false;
    }
  }

  async fetchAdsetsFromDatabase(fields = ["*"], filters = {}, limit, joins=[]) {
    const results = await this.adsetsRepository.fetchAdsets(fields, filters, limit, joins);
    return results;
  }
}

module.exports = AdsetsService;
