const AggregatesRepository = require('../repositories/AggregatesRepository');
const { AVAILABLE_NETWORKS, AVAILABLE_TRAFFIC_SOURCES } = require('../constants');
const { yesterdayYMD, dayYMD } = require('../../../../common/day');

class AggregatesService {

  constructor() {
    this.aggregatesRepository = new AggregatesRepository()
  }

  async paramConvertWrapper(callback, params) {

    const { startDate, endDate, campaignId, network, trafficSource, mediaBuyer, adAccountId, q } = params;
    console.log(params)

    if (!startDate || !endDate || startDate === ":startDate" || endDate === ":endDate") {
      throw new Error('Missing date parameters, please provide startDate and endDate in url pattern');
    }

    const pattern = /^(?:\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)?)$/;
    if (!pattern.test(startDate) || !pattern.test(endDate)) {
      throw new Error('Invalid date format');
    }

    if (network && !AVAILABLE_NETWORKS.includes(network)) {
      throw new Error('Invalid network');
    }

    if (trafficSource && !AVAILABLE_TRAFFIC_SOURCES.includes(trafficSource)) {
      throw new Error('Invalid traffic source');
    }

    const convertedStartDate = yesterdayYMD(startDate);
    const convertedEndDate = dayYMD(endDate);
    try {
      return await callback({
        startDate : convertedStartDate,
        endDate   :convertedEndDate,
        campaignId,
        network,
        trafficSource,
        mediaBuyer,
        adAccountId,
        q
      });
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }
  }

  async generateCampaignAdsetsReport(startDate, endDate, campaignId) {
    return await this.paramConvertWrapper(
      (...args) => this.aggregatesRepository.campaignAdsets(...args),
      {startDate, endDate, campaignId}
    );
  }

  async generateCampaignDailyReport(startDate, endDate, campaignId) {
    return await this.paramConvertWrapper(
      (...args) => this.aggregatesRepository.campaignDaily(...args),
      {startDate, endDate, campaignId}
    );
  }

  async generateCampaignHourlyReport(startDate, endDate, campaignId) {
    return await this.paramConvertWrapper(
      (...args) => this.aggregatesRepository.campaignHourly(...args),
      {startDate, endDate, campaignId}
    );
  }

  async generateTrafficSourceNetworkCampaignsAdsetsStatsReport(startDate, endDate,
    network="crossroads", trafficSource,
    mediaBuyer, adAccountId, q
  ) {

    return await this.paramConvertWrapper(
      (...args) => this.aggregatesRepository.trafficSourceNetowrkCampaignsAdsetsStats(...args),
      { startDate, endDate, network, trafficSource, mediaBuyer, adAccountId, q }
    )
  }

  async generateTrafficSourceNetworkCampaignsStatsReport(startDate, endDate,
    network="crossroads", trafficSource,
    mediaBuyer, adAccountId, q
  ) {
    return await this.paramConvertWrapper(
      (...args) => this.aggregatesRepository.trafficSourceNetworkCampaignsStats(...args),
      { startDate, endDate, network, trafficSource, mediaBuyer, adAccountId, q }
    )
  }

  async generateTrafficSourceNetworkDailyReport(startDate, endDate,
    network="crossroads", trafficSource,
    mediaBuyer, adAccountId, q
  ) {
    return await this.paramConvertWrapper(
      (...args) => this.aggregatesRepository.trafficSourceNetworkDaily(...args),
      { startDate, endDate, network, trafficSource, mediaBuyer, adAccountId, q }
    )
  }

  async generateTrafficSourceNetworkHourlyReport(startDate, endDate,
    network="crossroads", trafficSource,
    mediaBuyer, adAccountId, q
  ) {
    return await this.paramConvertWrapper(
      (...args) => this.aggregatesRepository.trafficSourceNetworkHourly(...args),
      { startDate, endDate, network, trafficSource, mediaBuyer, adAccountId, q }
    )
  }

  async updateAggregates(network, trafficSource, startDate, endDate) {
    const compiledAggregatedData = await this.aggregatesRepository.compileAggregates(
      network, trafficSource, startDate, endDate
    );
    await this.aggregatesRepository.upsert(compiledAggregatedData, trafficSource)
    return true;
  }

}


module.exports = AggregatesService;
