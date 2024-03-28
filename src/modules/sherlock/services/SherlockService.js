const SherlockRepository = require('../repositories/SherlockRepository');
const { SherlockLogger } = require('../../../shared/lib/WinstonLogger');

const { yesterdayYMD, dayYMD } = require('../../../shared/helpers/calendar');

class SherlockService {
  constructor() {
    this.sherlockRepository = new SherlockRepository();
  }

  async paramConvertWrapper(callback, params) {
    const {
      startDate,
      endDate,
      campaignId,
      network,
      trafficSource,
      mediaBuyer,
      adAccountId,
      q,
      orgId,
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
      adAccountId,
      q,
      orgId,
    };
    try {
      return await callback(finalParams);
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }
  }

  async generateFindingsDaily(startDate, endDate, campaignId, orgId) {
    return await this.paramConvertWrapper(
      (...args) => this.sherlockRepository.findingsDaily(...args),
      { startDate, endDate, campaignId, orgId },
    );
  }
}

module.exports = SherlockService;
