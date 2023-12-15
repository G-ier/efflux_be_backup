// Local application imports
const InsightsRepository          = require("../repositories/InsightsRepository");
const TonicBaseService            = require('./TonicBaseService');

class InsightsService extends TonicBaseService {

  constructor() {
    super();
    this.repository = new InsightsRepository();
  }

  async fetchInsights(fields = ["*"], filters = {}, limit) {
    this.logger.info(`Fetching Tonic Campaigns from the database`);
    const results = await this.repository.fetchInsights(fields, filters, limit);
    this.logger.info(`Fetched ${results.length} Tonic Campaigns from the database`);
    return results;
  }

  async fetchInsightsFromAPI(startDate, endDate, hour, final=false) {
    this.logger.info(`Fetching Tonic Insights from the API`);
    const endpoint = final
      ? `/epc/final?from=${startDate}&to=${endDate}${hour ? `&hour=${hour}` : ''}`
      : `/epc/daily?date=${startDate}&show_revenue_type=yes`;
    const response = await this.makeTonicAPIRequest('GET', endpoint, {}, 'Error fetching insights');
    this.logger.info(`Fetched ${response.length} Tonic Insights from the API`);
    return response;
  }

  async syncInsights(startDate, endDate, hour, final=false) {

    this.logger.info(`Syncing Tonic Insights for date range: ${startDate} - ${endDate} ${hour ? `at hour ${hour}` : ''}`);

    // Pass the neccessary Parameters
    const insights = await this.fetchInsightsFromAPI(startDate, endDate, hour, final);
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
