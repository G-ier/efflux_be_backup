// Local application imports
const InsightsRepository          = require("../repositories/InsightsRepository");
const TonicBaseService            = require('./TonicBaseService');
const ClickhouseRepository = require('../../../shared/lib/ClickhouseRepository');

class InsightsService extends TonicBaseService {

  constructor() {
    super();
    this.repository = new InsightsRepository();
    this.clickhouse = new ClickhouseRepository();
  }

  async fetchInsights(fields = ["*"], filters = {}, limit) {
    this.logger.info(`Fetching Tonic Campaigns from the database`);
    const results = await this.repository.fetchInsights(fields, filters, limit);
    this.logger.info(`Fetched ${results.length} Tonic Campaigns from the database`);
    return results;
  }

  async fetchInsightsClickhouse(network, ts, startDate, endDate) {
    this.logger.info(`Fetching Tonic Insights from the Clickhouse database`);
    const results = await this.clickhouse.queryClickHouseInsights(network, ts, startDate, endDate);
    this.logger.info(`Fetched ${results.length} Tonic Insights from the Clickhouse database`);
    return results;
  }
  async fetchCampaignsClickhouse(campaign_id) {
    this.logger.info(`Fetching Tonic Campaigns from the Clickhouse database`);
    const results = await this.clickhouse.queryClickHouseCampaigns(campaign_id);
    this.logger.info(`Fetched ${results.length} Tonic Campaigns from the Clickhouse database`);
    return results;
  }
  async fetchAdsetsClickhouse(adset_id) {
    this.logger.info(`Fetching Tonic Adsets from the Clickhouse database`);
    const results = await this.clickhouse.queryClickHouseInsights(adset_id);
    this.logger.info(`Fetched ${results.length} Tonic Adsets from the Clickhouse database`);
    return results;
  }

  async fetchInsightsFromAPI(account, startDate, endDate, hour, final=false) {
    this.logger.info(`Fetching Tonic Insights from the API`);
    const endpoint = final
      ? `/epc/final?from=${startDate}&to=${endDate}${hour ? `&hour=${hour}` : ''}`
      : `/epc/daily?date=${startDate}&show_revenue_type=yes`;
    const response = await this.makeTonicAPIRequest(account, 'GET', endpoint, {}, 'Error fetching insights');
    this.logger.info(`Fetched ${response.length} Tonic Insights from the API`);
    return response;
  }

  async syncInsights(account, startDate, endDate, hour, final=false) {

    this.logger.info(`Syncing Tonic Insights for date range: ${startDate} - ${endDate} ${hour ? `at hour ${hour}` : ''} for account ${account.email}`);

    // Pass the neccessary Parameters
    const insights = await this.fetchInsightsFromAPI(account, startDate, endDate, hour, final);
    this.logger.info(`Upserting ${insights.length} Tonic Insights`);
    await this.executeWithLogging(
      () => this.repository.upsert(insights),
      "Error processing and upserting bulk data"
    );
    this.logger.info(`Successfully synced ${insights.length} Tonic Insights`);
    return insights.length;
  }

}

module.exports = InsightsService;
