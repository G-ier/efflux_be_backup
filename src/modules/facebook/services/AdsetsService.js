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
        limit: 5000,
      };
      do {
        if (paging?.next) {
          url = paging.next;
          params = {};
        }
        const { data = [] } = await axios.get(url, { params }).catch((err) => {
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
    this.logger.info(
      `Ad Accounts Adsets Fetching Telemetry: SUCCESS(${results.sucess.length}) | ERROR(${results.error.length})`,
    );
    return _.flatten(allAdsets);
  }

  async syncAdsets(access_token, adAccountIds, adAccountsMap, campaignIds, startDate, endDate, preset = null) {
    let adsets = await this.getAdsetsFromApi(access_token, adAccountIds, startDate, endDate, (preset = null));
    adsets = adsets.filter((adset) => campaignIds.includes(adset.campaign_id));
    this.logger.info(`Upserting ${adsets.length} adsets`);
    await this.executeWithLogging(() => this.adsetsRepository.upsert(adsets, adAccountsMap), "Error upserting adsets");
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

  async createAdsetInFacebook(token, adAccountId, adsetDetails) {
    const url = `${FB_API_URL}act_${adAccountId}/adsets`;

    try {
      // Attempt to create the adset via Facebook's API
      const response = await axios.post(url, {
        ...adsetDetails,
        access_token: token,
      });

      // If the response has data and an id, assume success
      if (response.data && response.data.id) {
        return response.data;
      } else {
        throw new Error("Facebook response did not include an id.");
      }
    } catch (err) {
      // Log the error details
      console.warn(`Failed to create adset in Facebook for ad_account_id ${adAccountId}`, err.response?.data ?? err);
      // Rethrow the error for the caller to handle
      throw err?.response?.data?.error
    }
  }
 
  async createAdset(token, adAccountId, adsetDetails, adAccountsDataMap) {
    try {
      // Create the adset on Facebook
      const facebookResponse = await this.createAdsetInFacebook(token, adAccountId, adsetDetails);

      // Prepare the object for the database
      const dbObject = { ...facebookResponse, ...adsetDetails, account_id: adAccountId };

      // Save the adset to your local database
      await this.adsetsRepository.upsert([dbObject], adAccountsDataMap);

     return facebookResponse
    } catch (err) {
      // Log the error and rethrow it to be handled by the caller
      console.error("Error in createAdset service method:", err.message);
      throw err;
    }
  }

  async fetchAdsetsFromDatabase(fields = ["*"], filters = {}, limit, joins = []) {
    const results = await this.adsetsRepository.fetchAdsets(fields, filters, limit, joins);
    return results;
  }
}

module.exports = AdsetsService;
