// Third party imports
const axios = require("axios");
const async = require("async");
const _ = require("lodash");

// Local application imports
const AdsetsRepository = require("../repositories/AdsetsRepository");
const { FB_API_URL } = require("../constants");
const { sendSlackNotification } = require("../../../shared/lib/SlackNotificationService");

class AdsetsService {
  constructor() {
    this.adsetsRepository = new AdsetsRepository();
  }

  async getAdsetsFromApi(access_token, adAccountIds, date = "today") {
    const isPreset = !/\d{4}-\d{2}-\d{2}/.test(date);
    const dateParam = isPreset ? { date_preset: date } : { time_range: { since: date, until: date } };

    const fields =
      "id,account_id,campaign_id,status,name,daily_budget,lifetime_budget,created_time,start_time,stop_time,budget_remaining,updated_time";

    const allAdsets = await async.mapLimit(adAccountIds, 100, async (adAccountId) => {
      const url = `${FB_API_URL}${adAccountId}/adsets`;
      const response = await axios
        .get(url, {
          params: {
            fields,
            ...dateParam,
            access_token,
            limit: 5000,
          },
        })
        .catch((err) =>
          console.warn(`facebook adsets failure on ad_account_id ${adAccountId}`, err.response?.data ?? err),
        );

      return response?.data?.data || [];
    });

    return _.flatten(allAdsets);
  }

  async syncAdsets(access_token, adAccountIds, adAccountsMap, campaignIds, date = "today") {
    let adsets = await this.getAdsetsFromApi(access_token, adAccountIds, date);
    adsets = adsets.filter((adset) => campaignIds.includes(adset.campaign_id));
    try {
      await this.adsetsRepository.upsert(adsets, adAccountsMap);
    } catch (e) {
      console.log("ERROR UPDATING ADSETS", e);
      await sendSlackNotification("ERROR UPDATING ADSETS. Inspect software if this is a error", e);
      return [];
    }
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
  async fetchAdsetsFromDatabase(fields = ["*"], filters = {}, limit) {
    const results = await this.adsetsRepository.fetchAdsets(fields, filters, limit);
    return results;
  }
}

module.exports = AdsetsService;
