const { getTikTokEndpointData, calculateAccumulated } = require("../helpers");
const { TIKTOK_INSIGHTS_ADDITIONAL_PARAMS } = require("../constants");
const AdInsightRepository = require("../repositories/AdInsightsRepository");
const { TiktokLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");

class AdInsightsService extends BaseService {

  constructor(database) {
    super(TiktokLogger);
    this.adInsightRepository = new AdInsightRepository(database);
  }

  async getTikTokAdInsights(access_token, adAccountIds, date) {
    const endpoint = "report/integrated";
    const additionalParams = {
      ...TIKTOK_INSIGHTS_ADDITIONAL_PARAMS,
      start_date: date,
      end_date: date,
    };
    this.logger.info("Fetching Ad Insights from API");
    return await getTikTokEndpointData(endpoint, access_token, adAccountIds, additionalParams);
  }

  async syncAdInsights(access_token, adAccountIds, campaignIdsMap, date) {
    const adInsights = await this.getTikTokAdInsights(access_token, adAccountIds, date);
    this.logger.info(`Upserting ${adInsights.length} Ad Insights`);
    await this.adInsightRepository.upsert(adInsights, campaignIdsMap, 500);
    this.logger.info(`Done upserting ad insights`);
    return adInsights.map((adInsight) => adInsight.ad_id);
  }

  async fetchAdInsightsFromDatabase(fields = ["*"], filters = {}, limit) {
    return await this.adInsightRepository.fetchAdInsights(fields, filters, limit);
  }
}

module.exports = AdInsightsService;
