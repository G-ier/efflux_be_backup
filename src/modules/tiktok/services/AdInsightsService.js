const { getTikTokEndpointData } = require("../helpers");
const { TIKTOK_INSIGHTS_ADDITIONAL_PARAMS } = require("../constants");
const AdInsightRepository = require("../repositories/AdInsightsRepository");

class AdInsightsService {
  constructor(database) {
    this.adInsightRepository = new AdInsightRepository(database);
  }

  async getTikTokAdInsights(access_token, adAccountIds, date) {
    const endpoint = "report/integrated";
    const additionalParams = {
      ...TIKTOK_INSIGHTS_ADDITIONAL_PARAMS,
      start_date: date,
      end_date: date,
    };

    return await getTikTokEndpointData(endpoint, access_token, adAccountIds, additionalParams);
  }

  async syncAdInsights(access_token, adAccountIds, adAccountsMap, date) {
    const adInsights = await this.getTikTokAdInsights(access_token, adAccountIds, date);
    await this.adInsightRepository.upsert(adInsights, adAccountsMap, 500);
    return adInsights.map((adInsight) => adInsight.ad_id);
  }

  async fetchAdInsightsFromDatabase(fields = ["*"], filters = {}, limit) {
    return await this.adInsightRepository.fetchAdInsights(fields, filters, limit);
  }
}

module.exports = AdInsightsService;
