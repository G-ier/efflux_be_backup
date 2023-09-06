// Third party imports
const _                                         = require('lodash');

// Local application imports
const campaignAdsets                            = require('../reports/campaignAdsets');
const campaignDaily                             = require('../reports/campaignDaily');
const campaignHourly                            = require('../reports/campaignHourly');
const revealBotSheets                           = require('../reports/revealBotSheets');
const trafficSourceNetowrkCampaignsAdsetsStats  = require('../reports/trafficSourceNetowrkCampaignsAdsetsStats');
const trafficSourceNetworkCampaignsStats        = require('../reports/trafficSourceNetworkCampaignsStats');
const trafficSourceNetworkDaily                 = require('../reports/trafficSourceNetworkDaily');
const trafficSourceNetworkHourly                = require('../reports/trafficSourceNetworkHourly');
const compileAggregates                        = require('../reports/compileAggregates');
const DatabaseRepository                        = require("../../../shared/lib/DatabaseRepository");

class AggregatesRepository {

  constructor(database) {
    this.tableName = "insights";
    this.database = database || new DatabaseRepository();
  }

  async revealBotSheets(startDate, endDate, aggregateBy="campaigns", trafficSource="facebook") {
    return await revealBotSheets(this.database, startDate, endDate, aggregateBy, trafficSource);
  }

  async campaignAdsets(params) {
    const { startDate, endDate, campaignId } = params;
    return await campaignAdsets(this.database, startDate, endDate, campaignId);
  }

  async campaignDaily(params) {
    const { startDate, endDate, campaignId } = params;
    return await campaignDaily(this.database, startDate, endDate, campaignId);
  }

  async campaignHourly(params) {
    const { startDate, endDate, campaignId } = params;
    return await campaignHourly(this.database, startDate, endDate, campaignId);
  }

  async trafficSourceNetowrkCampaignsAdsetsStats(params) {
    const { startDate, endDate, network, trafficSource, mediaBuyer, adAccountId, q } = params;
    return await trafficSourceNetowrkCampaignsAdsetsStats(this.database,
      startDate, endDate,
      network, trafficSource,
      mediaBuyer, adAccountId, q)
    ;
  }

  async trafficSourceNetworkCampaignsStats(params) {
    const { startDate, endDate, network, trafficSource, mediaBuyer, adAccountId, q } = params;
    return await trafficSourceNetworkCampaignsStats(this.database,
      startDate, endDate,
      network, trafficSource,
      mediaBuyer, adAccountId, q)
    ;
  }

  async trafficSourceNetworkDaily(params) {
    const { startDate, endDate, network, trafficSource, mediaBuyer, adAccountId, q } = params;
    return await trafficSourceNetworkDaily(this.database,
      startDate, endDate,
      network, trafficSource,
      mediaBuyer, adAccountId, q
    );
  }

  async trafficSourceNetworkHourly(params) {
    const { startDate, endDate, network, trafficSource, mediaBuyer, adAccountId, q } = params;
    return await trafficSourceNetworkHourly(this.database,
      startDate, endDate,
      network, trafficSource,
      mediaBuyer, adAccountId, q
    );
  }


  async compileAggregates(network, trafficSource, startDate, endDate) {
    return await compileAggregates(this.database, network, trafficSource, startDate, endDate);
  }

  async upsert(data, trafficSource, chunkSize = 500) {
    const mappedData = data.map(row => this.toDatabaseDTO(row, trafficSource))
    const dataChunks = _.chunk(mappedData, chunkSize);
    for (const chunk of dataChunks) {
        await this.database.upsert(this.tableName, chunk, "unique_identifier");
    }
    return dataChunks;
  }

  toDatabaseDTO(row, trafficSource) {
    row.traffic_source = trafficSource
    row.unique_identifier = `${row.adset_id}-${row.date}-${row.hour}`
    delete row.ad_account_name;
    return row
  }

}

module.exports = AggregatesRepository;
