// Third party imports
const axios = require("axios");
const async = require("async");
const _ = require("lodash");

// Local application imports
const AdInsightRepository = require("../repositories/AdInsightsRepository");
const { FacebookLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");
const { FB_API_URL, delay } = require('../constants');
const { listDatesBetween } = require('../helpers');

class AdInsightsService extends BaseService{

  constructor() {
    super(FacebookLogger);
    this.adInsightRepository = new AdInsightRepository();
    this.defaultInsightsStats = {
      campaign_name: "No name",
      spend: 0,
      inline_link_clicks: 0,
      cpc: 0,
      conversions: [{ action_type: "default", value: "0" }],
      ctr: 0,
      impressions: 0,
      clciks: 0,
    };;
  }

  async getAdInsightsFromAPI(access_token, adAccountIds, startDate, endDate, preset=null) {

    this.logger.info(`Fetching Insights from API`);

    const dateParam = preset ? { date_preset: preset }
    : startDate === endDate ? { time_range: { since: startDate, until: endDate } }
    : { time_ranges: listDatesBetween(startDate, endDate).map(date => {
      return { since: date, until: date }
    }) };

    const fields =
      "account_id,ad_id,adset_id,inline_link_clicks,campaign_id,date_start,date_stop,impressions,clicks,reach,frequency,spend,cpc,ad_name,adset_name,campaign_name,account_currency,conversions,actions";
    const results = { sucess: [], error: [] };
    const allInsights = await async.mapLimit(adAccountIds, 100, async (adAccountId) => {
      let paging = {};
      const insights = [];
      let url = `${FB_API_URL}${adAccountId}/insights`;
      let params = {
        fields,
        level: "ad",
        breakdowns: "hourly_stats_aggregated_by_advertiser_time_zone",
        ...dateParam,
        access_token,
        limit: 500,
      };
      do {
        if (paging?.next) {
          url = paging.next;
          params = {};
        }

        const { data = [] } = await axios
          .get(url, {
            params,
          })
          .catch((err) => {
            results.error.push(adAccountId);
            return {};
          });

        results.sucess.push(adAccountId);
        paging = { ...data?.paging };
        if (data?.data?.length) insights.push(...data?.data);
        await delay(1000);
      } while (paging?.next);

      return insights.length ? insights.map((item) => _.defaults(item, this.defaultInsightsStats)) : [];
    });
    if (results.sucess.length === 0) throw new Error("All ad accounts failed to fetch insights");
    this.logger.info(`Ad Accounts Insights Fetching Telemetry: SUCCESS(${results.sucess.length}) | ERROR(${results.error.length})`);
    return _.flatten(allInsights);
  }

  async getAdInsightsByDate(access_token, adAccountIds, date) {
    const isPreset = !/\d{4}-\d{2}-\d{2}/.test(date);
    const dateParam = isPreset ? { date_preset: date } : { time_range: { since: date, until: date } };

    const fields = "ad_id,adset_id,campaign_id,date_start,actions,cost_per_action_type";

    const allInsights = await async.mapLimit(adAccountIds, 100, async (adAccountId) => {
      let paging = {};
      const insights = [];
      let url = `${FB_API_URL}${adAccountId}/insights`;
      let params = {
        fields,
        level: "ad",
        ...dateParam,
        access_token,
        limit: 500,
      };
      do {
        if (paging?.next) {
          url = paging.next;
          params = {};
        }
        const { data = [] } = await axios
          .get(url, {
            params,
          })
          .catch((err) => {
            // console.warn(`facebook insights failure for ad_account ${adAccountId}`, err.response?.data ?? err);
            return {};
          });
        paging = { ...data?.paging };
        if (data?.data?.length) insights.push(...data?.data);
        await delay(1000);
      } while (paging?.next);
      // console.log('insights.length', insights.length)
      return insights.length ? insights.map((item) => _.defaults(item, this.defaultInsightsStats)) : [];
    });

    return _.flatten(allInsights);

  }

  async syncAdInsights(access_token, adAccountIds, startDate, endDate, preset=null) {
    const insights = await this.getAdInsightsFromAPI(access_token, adAccountIds, startDate, endDate, preset);
    this.logger.info(`Upserting ${insights.length} insights`);
    await this.executeWithLogging(
      () => this.adInsightRepository.upsert(insights),
      "Error upserting insights"
    )
    this.logger.info(`Done upserting insights`);
    return insights
  }

  async fetchAdInsightsFromDatabase(fields = ['*'], filters = {}, limit) {
    const results = await this.adInsightRepository.fetchAdInsights(fields, filters, limit);
    return results;
  }

}

module.exports = AdInsightsService;
