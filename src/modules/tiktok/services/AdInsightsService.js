const { getTikTokEndpointData, calculateAccumulated } = require("../helpers");
const { TIKTOK_INSIGHTS_ADDITIONAL_PARAMS } = require("../constants");
const AdInsightRepository = require("../repositories/AdInsightsRepository");
const { TiktokLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");
const UserAccountService = require("./UserAccountService");
const AdAccountService = require("./AdAccountsService");
const CampaignService = require("./CampaignsService");
const _ = require("lodash");
const { getDatesBetween } = require("../../../shared/helpers/Utils")

class AdInsightsService extends BaseService {

  constructor(database) {
    super(TiktokLogger);
    this.adInsightRepository = new AdInsightRepository(database);
    this.adAccountService = new AdAccountService();
    this.userAccountsService = new UserAccountService();
    this.campaignService = new CampaignService();
  }

  async getTikTokAdInsights(access_token, adAccountIds, date, endDate) {

    const endpoint = "report/integrated";
    const dates = endDate ? getDatesBetween(date, endDate) : [date];
    this.logger.info(`Fetching ad insights for dates: ${dates.join(",")}`);
    const data = [];
    for (const date of dates) {
      this.logger.info(`Fetching ad insights for date: ${date}`);
      const additionalParams = {
        ...TIKTOK_INSIGHTS_ADDITIONAL_PARAMS,
        start_date: date,
        end_date: date,
      };
      try {
        const adInsights = await getTikTokEndpointData(endpoint, access_token, adAccountIds, additionalParams);
        data.push(...adInsights);
      } catch (error) {
        this.logger.error(`Failed to fetch ad insights for date: ${date} : ${error.message}`);
      }
    }
    return _.flatten(data);
  }

  async syncAdInsights(access_token, adAccountIds, campaignIdsMap, date, endDate) {
    const adInsights = await this.getTikTokAdInsights(access_token, adAccountIds, date, endDate);
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
