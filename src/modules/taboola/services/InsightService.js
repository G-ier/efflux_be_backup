// Third party imports
const axios = require("axios");
const async = require("async");
const _ = require("lodash");

// Local imports
const { TaboolaLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");
const { TABOOLA_URL } = require('../constants');
const InsightRepository = require("../repositories/InsightRepository");
const { stringify } = require("uuid");

class InsightService  extends BaseService{
    
    constructor(){
        super(TaboolaLogger);
        this.insightRepository = new InsightRepository();
    }

    async getInsightsFromAPI(ad_accounts, access_token,  start_date, end_date){

        this.logger.info(`Fetching Ad Insights from API`);
        const results = { sucess: [], error: [] };
        start_date = `${start_date}T00:00:00`;
        end_date = `${end_date}T23:59:59`;

        const headers = {
            "Authorization": `Bearer ${access_token}`,
            'Content-Type': 'application/json',
        }
        const allInsights = await async.mapLimit(ad_accounts, 100, async (ad_account) => {
            let paging = {};
            const insights = [];
            let url = `${TABOOLA_URL}/api/1.0/${ad_account}/reports/campaign-summary/dimensions/campaign_hour_breakdown`;
            const params = {
              start_date: start_date,
              end_date: end_date
            };
            do {
              if (paging?.next) {
                url = paging.next;
                params = {};
              }
              const { data = [] } = //await axios.get(
                // finalURL, { header })
                await this.fetchFromApi(url, params, "Error", headers).catch((err) => {
                  console.log(err);
                  results.error.push(ad_account);
                  return {};
                });
              results.sucess.push(ad_account);
              paging = { ...data?.paging };
              if (data?.results?.length) insights.push(...data.results);
            } while (paging?.next);
            return insights;
          });
          if (results.sucess.length === 0) throw new Error("All ad accounts failed to fetch Insights");
          this.logger.info(
            `Ad Accounts Insights Fetching Telemetry: SUCCESS(${results.sucess.length}) | ERROR(${results.error.length})`,
          );
          return _.flatten(allInsights);
    }

    async syncInsights(ad_accounts, access_token, start_date, end_date){
      const insights = await this.getInsightsFromAPI(ad_accounts, access_token, start_date, end_date);
      this.logger.info(`Upserting ${insights.length} insights.`);
      await this.executeWithLogging(
        () => this.insightRepository.upsert(insights, 500),
        "Error Upserting Campaigns",
      );
      this.logger.info(`Done upserting insights`);
      return insights;
    }
}

module.exports = InsightService;