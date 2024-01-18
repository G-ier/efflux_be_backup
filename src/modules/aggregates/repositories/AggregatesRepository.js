// Third party imports
const _ = require('lodash');

// Local application imports
const campaignAdsets = require('../reports/campaignAdsets');
const campaignDaily = require('../reports/campaignDaily');
const campaignHourly = require('../reports/campaignHourly');
const revealBotSheets = require('../reports/revealBotSheets');
const trafficSourceNetowrkCampaignsAdsetsStats = require('../reports/trafficSourceNetowrkCampaignsAdsetsStats');
const trafficSourceNetworkCampaignsStats = require('../reports/trafficSourceNetworkCampaignsStats');
const trafficSourceNetworkDaily = require('../reports/trafficSourceNetworkDaily');
const trafficSourceNetworkHourly = require('../reports/trafficSourceNetworkHourly');
const compileAggregates = require('../reports/compileAggregates');
const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');
const adsetsByCampaignId = require('../reports/adsetsByCampaignId');
const ClickhouseRepository = require('../../../shared/lib/ClickhouseRepository');
// const SqsService = require('../../../shared/lib/SQSPusher');

class AggregatesRepository {
  constructor(database) {
    this.tableName = 'insights';
    this.database = database || new DatabaseRepository();
    this.clickhouse = new ClickhouseRepository();

    // const queueUrl =
    //   process.env.INSIGHTS_QUEUE_URL ||
    //   'https://sqs.us-east-1.amazonaws.com/524744845066/efflux-insights-to-clickhouse';

    // this.sqsService = new SqsService(queueUrl);
  }

  async revealBotSheets(
    startDate,
    endDate,
    aggregateBy = 'campaigns',
    trafficSource = 'facebook',
    network = 'crossroads',
    today = false,
  ) {
    return await revealBotSheets(
      this.database,
      startDate,
      endDate,
      aggregateBy,
      trafficSource,
      network,
      today,
    );
  }

  async campaignAdsets(params) {
    const { startDate, endDate, campaignId } = params;

    // Check if campaignId is an array
    if (Array.isArray(campaignId)) {
      return await adsetsByCampaignId(this.database, startDate, endDate, campaignId);
    } else {
      return await campaignAdsets(this.database, startDate, endDate, campaignId);
    }
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
    return await trafficSourceNetowrkCampaignsAdsetsStats(
      this.database,
      startDate,
      endDate,
      network,
      trafficSource,
      mediaBuyer,
      adAccountId,
      q,
    );
  }

  async trafficSourceNetworkCampaignsStats(params) {
    const { startDate, endDate, network, trafficSource, mediaBuyer, adAccountId, q } = params;
    return await trafficSourceNetworkCampaignsStats(
      this.database,
      startDate,
      endDate,
      network,
      trafficSource,
      mediaBuyer,
      adAccountId,
      q,
    );
  }

  async trafficSourceNetworkDaily(params) {
    const { startDate, endDate, network, trafficSource, mediaBuyer, adAccountId, q } = params;
    return await trafficSourceNetworkDaily(
      this.database,
      startDate,
      endDate,
      network,
      trafficSource,
      mediaBuyer,
      adAccountId,
      q,
    );
  }

  async trafficSourceNetworkHourly(params) {
    const { startDate, endDate, network, trafficSource, mediaBuyer, adAccountId, q } = params;
    return await trafficSourceNetworkHourly(
      this.database,
      startDate,
      endDate,
      network,
      trafficSource,
      mediaBuyer,
      adAccountId,
      q,
    );
  }

  async compileAggregates(network, trafficSource, startDate, endDate, campaignIdsRestriction) {
    return await compileAggregates(
      this.database,
      network,
      trafficSource,
      startDate,
      endDate,
      campaignIdsRestriction,
    );
  }

  async upsert(data, trafficSource, network, chunkSize = 500) {
    const mappedData = data.map((row) => this.toDatabaseDTO(row, trafficSource, network));
    const dataChunks = _.chunk(mappedData, chunkSize);
    for (const chunk of dataChunks) {
      // push to SQS queue (for storing in data lake)
      // await this.sqsService.sendMessageToQueue(chunk);

      await this.database.upsert(this.tableName, chunk, 'unique_identifier');
      await this.clickhouse.insertData(chunk);
    }
    return dataChunks;
  }

  toDatabaseDTO(row, trafficSource, network) {
    row.network = network;
    row.traffic_source = trafficSource;
    if (trafficSource === 'taboola') {
      row.unique_identifier = `${row.campaign_id}-${row.date}-${row.hour}`;
    } else {
      row.unique_identifier = `${row.adset_id}-${row.date}-${row.hour}`;
    }
    delete row.ad_account_name;
    return row;
  }
}

module.exports = AggregatesRepository;
