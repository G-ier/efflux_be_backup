// Third party imports
const _ = require('lodash');

// Local application imports
const campaignAdsets = require('../reports/campaignAdsets');
const campaignDaily = require('../reports/campaignDaily');
const campaignHourly = require('../reports/campaignHourly');
const trafficSourceNetowrkCampaignsAdsetsStats = require('../reports/trafficSourceNetowrkCampaignsAdsetsStats');
const trafficSourceNetworkCampaignsStats = require('../reports/trafficSourceNetworkCampaignsStats');
const trafficSourceNetworkDaily = require('../reports/trafficSourceNetworkDaily');
const trafficSourceNetworkHourly = require('../reports/trafficSourceNetworkHourly');
const networkCampaignData = require('../reports/networkCampaignsView');
const adAccountData = require('../reports/adAccountView');
const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');
const adsetsByCampaignId = require('../reports/adsetsByCampaignId');

class AggregatesRepository {

  constructor(database) {
    this.tableName = 'insights';
    this.database = database || new DatabaseRepository();
  }

  async campaignAdsets(params) {
    const { startDate, endDate, campaignId, orgId } = params;
    // Check if campaignId is an array
    if (Array.isArray(campaignId)) {
      return await adsetsByCampaignId(this.database, startDate, endDate, campaignId);
    } else {
      return await campaignAdsets(this.database, startDate, endDate, campaignId, orgId);
    }
  }

  async campaignDaily(params) {
    const { startDate, endDate, campaignId } = params;
    return await campaignDaily(this.database, startDate, endDate, campaignId);
  }

  async campaignHourly(params) {
    const { startDate, endDate, campaignId, orgId } = params;
    return await campaignHourly(this.database, startDate, endDate, campaignId, orgId);
  }

  async trafficSourceNetowrkCampaignsAdsetsStats(params) {
    const { startDate, endDate, network, trafficSource, mediaBuyer, adAccountId } = params;
    return await trafficSourceNetowrkCampaignsAdsetsStats(
      this.database,
      startDate,
      endDate,
      network,
      trafficSource,
      mediaBuyer,
      adAccountId
    );
  }

  async trafficSourceNetworkCampaignsStats(params) {
    const { startDate, endDate, network, trafficSource, mediaBuyer, adAccountId, q, orgId } =
      params;
    return await trafficSourceNetworkCampaignsStats(
      this.database,
      startDate,
      endDate,
      network,
      trafficSource,
      mediaBuyer,
      adAccountId,
      q,
      orgId,
    );
  }

  async trafficSourceNetworkDaily(params) {
    const { startDate, endDate, mediaBuyer, adAccountId } =
      params;
    return await trafficSourceNetworkDaily(
      this.database,
      startDate,
      endDate,
      mediaBuyer,
      adAccountId
    );
  }

  async trafficSourceNetworkHourly(params) {
    const { startDate, endDate, mediaBuyer, adAccountId } =
      params;
    return await trafficSourceNetworkHourly(
      this.database,
      startDate,
      endDate,
      mediaBuyer,
      adAccountId
    );
  }

  async networkCampaignGrouping(params){

    const { network, mediaBuyer, startDate, endDate } = params;

    return await networkCampaignData(
      this.database,
      startDate,
      endDate,
      mediaBuyer,
      network
    );

  }

  async adAccountsGrouping(params){
    const { trafficSource, mediaBuyer, startDate, endDate } = params;

    return await adAccountData(
      this.database,
      startDate,
      endDate,
      mediaBuyer,
      trafficSource
    );

  }

}

module.exports = AggregatesRepository;
