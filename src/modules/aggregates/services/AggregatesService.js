const AggregatesRepository = require('../repositories/AggregatesRepository');
const { AVAILABLE_NETWORKS, AVAILABLE_TRAFFIC_SOURCES } = require('../constants');

const { yesterdayYMD, dayYMD } = require('../../../shared/helpers/calendar');

class AggregatesService {

  constructor() {
    this.aggregatesRepository = new AggregatesRepository();
  }

  async paramConvertWrapper(callback, params) {
    const {
      startDate,
      endDate,
      campaignId,
      network,
      trafficSource,
      mediaBuyer,
      adAccountId
    } = params;
    if (!startDate || !endDate) {
      throw new Error(
        'Missing date parameters, please provide startDate and endDate in url pattern',
      );
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
    const finalParams = {
      startDate: convertedStartDate,
      endDate: convertedEndDate,
      campaignId,
      network,
      trafficSource,
      mediaBuyer,
      adAccountId
    };
    try {
      return await callback(finalParams);
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }
  }

  async generateCampaignAdsetsReport(startDate, endDate, campaignId, orgId) {
    return await this.paramConvertWrapper(
      (...args) => this.aggregatesRepository.campaignAdsets(...args),
      { startDate, endDate, campaignId, orgId },
    );
  }

  async generateCampaignDailyReport(startDate, endDate, campaignId) {
    return await this.paramConvertWrapper(
      (...args) => this.aggregatesRepository.campaignDaily(...args),
      { startDate, endDate, campaignId },
    );
  }

  async generateCampaignHourlyReport(startDate, endDate, campaignId, orgId) {
    return await this.paramConvertWrapper(
      (...args) => this.aggregatesRepository.campaignHourly(...args),
      { startDate, endDate, campaignId, orgId },
    );
  }

  async generateTrafficSourceNetworkCampaignsAdsetsStatsReport(
    startDate,
    endDate,
    network = 'crossroads',
    trafficSource,
    mediaBuyer,
    adAccountId
  ) {
    return await this.paramConvertWrapper(
      (...args) => this.aggregatesRepository.trafficSourceNetowrkCampaignsAdsetsStats(...args),
      { startDate, endDate, network, trafficSource, mediaBuyer, adAccountId},
    );
  }

  async generateTrafficSourceNetworkCampaignsStatsReport(
    startDate,
    endDate,
    network = 'crossroads',
    trafficSource,
    mediaBuyer,
    adAccountId,
    q,
    orgId,
  ) {
    return await this.paramConvertWrapper(
      (...args) => this.aggregatesRepository.trafficSourceNetworkCampaignsStats(...args),
      { startDate, endDate, network, trafficSource, mediaBuyer, adAccountId, q, orgId },
    );
  }

  async generateTrafficSourceNetworkDailyReport(
    startDate,
    endDate,
    mediaBuyer,
    adAccountId
  ) {
    return await this.paramConvertWrapper(
      (...args) => this.aggregatesRepository.trafficSourceNetworkDaily(...args),
      { startDate, endDate, mediaBuyer, adAccountId },
    );
  }

  async generateTrafficSourceNetworkHourlyReport(
    startDate,
    endDate,
    mediaBuyer,
    adAccountId,
  ) {
    return await this.paramConvertWrapper(
      (...args) => this.aggregatesRepository.trafficSourceNetworkHourly(...args),
      { startDate, endDate, mediaBuyer, adAccountId },
    );
  }

  async getNetworkCampaigns(network, mediaBuyerId, startDate, endDate) {

    return await this.paramConvertWrapper(
      (...args) => this.aggregatesRepository.networkCampaignGrouping(...args),
      { network, mediaBuyer: mediaBuyerId, startDate, endDate },
    );

  }

  async getAdAccountsSpend(trafficSource, mediaBuyerId, startDate, endDate) {
    return await this.paramConvertWrapper(
      (...args) => this.aggregatesRepository.adAccountsGrouping(...args),
      { trafficSource, mediaBuyer: mediaBuyerId, startDate, endDate },
    );
  }
}

module.exports = AggregatesService;
