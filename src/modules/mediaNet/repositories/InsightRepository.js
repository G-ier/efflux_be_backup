// Third Party Imports
const _ = require('lodash');

// Local Imports
const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');
const { extractDateHourFromUnixTimestamp, isNotNumeric } = require('../../../shared/helpers/Utils');
const SqsService = require('../../../shared/lib/SQSPusher');

class InsightRepository {
  constructor() {
    this.tableName = 'medianet_raw_insights';
    this.aggregatesTableName = 'medianet';
    this.database = new DatabaseRepository();

    const queueUrl =
      process.env.CROSSROAD_QUEUE_URL ||
      'https://sqs.us-east-1.amazonaws.com/524744845066/edge-pipeline-medianet-queue';

    this.sqsService = new SqsService(queueUrl);
  }

  async fetchInsights(fields = ['*'], filters = {}, limit) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results;
  }

  parseMediaNetAPIData(insight) {
    // MAPPING
    // channel: user-agent
    // channelName2: pixel_id_|_campaign_id_|_adset_id_|_ad_id_|_traffic_source_|_external
    // channelName3: ip_|_country_code_|_region_|_city_|_timestamp_|_campaign_name_|_hit_id

    // New Extracted Fields
    const user_agent = insight.channel || 'Unknown';
    let [pixel_id, campaign_id, adset_id, ad_id, traffic_source, external] = insight.channelName2
      ? insight.channelName2.split('_|_')
      : ['Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown'];
    let [ip, country_code, region, city, timestamp, campaign_name, session_id] =
      insight.channelName3
        ? insight.channelName3.split('_|_')
        : ['Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown'];

    session_id = session_id && /^[0-9a-zA-Z]+$/.test(session_id) ? session_id : 'Unknown';
    const [date, hour] = timestamp
      ? extractDateHourFromUnixTimestamp(timestamp)
      : ['1970-01-01', 0];

    if (isNotNumeric(campaign_id)) campaign_id = 'Unknown';
    if (isNotNumeric(adset_id)) adset_id = 'Unknown';
    if (isNotNumeric(ad_id)) ad_id = 'Unknown';
    if (isNotNumeric(pixel_id)) pixel_id = 'Unknown';
    if (!['tiktok', 'facebook'].includes(traffic_source)) traffic_source = 'Unknown';

    return {
      date: date,
      hour: +hour,

      // Traffic Source Data
      pixel_id: pixel_id,
      campaign_id: campaign_id,
      campaign_name: campaign_name || 'Unknown',
      adset_id: adset_id,
      adset_name: '',
      ad_id: ad_id,
      ad_name: '',
      traffic_source: traffic_source,

      // User Data
      session_id: session_id,
      ip: ip || 'Unknown',
      country_code: country_code || 'Unknown',
      region: region || 'Unknown',
      city: city || 'Unknown',
      external: external || 'Unknown',
      timestamp: timestamp || 'Unknown',
      user_agent: user_agent || 'Unknown',

      // Conversion Data
      impressions: insight.impressions ? parseInt(insight.impressions) : 0,
      conversions: insight.ad_clicks ? parseInt(insight.ad_clicks) : 0,
      revenue: insight.estimated_revenue ? parseFloat(insight.estimated_revenue) : 0,

      // Identifier
      unique_identifier: `${timestamp}-${session_id}`,
    };
  }

  cleanseData(insight) {
    // Remove user specific data from the insight
    const cleansedCopy = { ...insight };
    delete cleansedCopy.ip;
    delete cleansedCopy.country_code;
    delete cleansedCopy.region;
    delete cleansedCopy.city;
    delete cleansedCopy.session_id;
    delete cleansedCopy.keyword_clicked;
    delete cleansedCopy.external;
    delete cleansedCopy.timestamp;
    delete cleansedCopy.user_agent;
    cleansedCopy.unique_identifier = `${insight.campaign_id}-${insight.adset_id}-${insight.ad_id}-${insight.hour}-${insight.date}`;
    return cleansedCopy;
  }

  aggregateInsights(aggregate, insight) {
    // Aggregate the data from the insight into the aggregate object

    Object.keys(insight).forEach((key) => {
      if (key === 'hour') {
        aggregate[key] = insight[key];
      } else if (_.isNumber(insight[key])) {
        aggregate[key] = (aggregate[key] || 0) + insight[key];
      } else {
        aggregate[key] = insight[key]; // for other non-numeric fields
      }
    });
  }

  async processMediaNetData(insights) {
    // Process raw data and aggregated data in a single loop
    const hourlyAdsets = {};
    const rawData = [];

    for (const insight of insights) {

      // Save raw data
      const parsedInsight = this.parseMediaNetAPIData(insight);
      if (
        parsedInsight.session_id != 'Unknown' &&
        !parsedInsight.user_agent.includes('facebookexternalhit')
      ) {
        rawData.push(parsedInsight);
        // push to SQS queue (for storing in data lake)
        // TODO: Temporary disabled. Enable when update to BatchWriteItem
        await this.sqsService.sendMessageToQueue(parsedInsight);
      }

      // Clean insight data
      const cleansedInsight = this.cleanseData(parsedInsight);
      const adsetHourKey = `${cleansedInsight.adset_id}-${cleansedInsight.hour}`;

      // Aggregate data
      if (hourlyAdsets[adsetHourKey]) {
        this.aggregateInsights(hourlyAdsets[adsetHourKey], cleansedInsight);
      } else {
        hourlyAdsets[adsetHourKey] = cleansedInsight;
      }
    }

    return [rawData, Object.values(hourlyAdsets)];
  }

  async upsert(insights, chunkSize = 500) {
    // Process Tonic Data
    const [rawData, adsetAggregatedData] = await this.processMediaNetData(insights);
    console.log(rawData);
    console.log(adsetAggregatedData);
    // Upsert raw user session data
    const dataChunks = _.chunk(rawData, chunkSize);
    for (const chunk of dataChunks) {
      // upsert to database
      await this.database.upsert(this.tableName, chunk, 'unique_identifier');
    }

    // Upsert aggregate data
    const aggregateChunks = _.chunk(adsetAggregatedData, chunkSize);
    for (const chunk of aggregateChunks) {
      await this.database.upsert(this.aggregatesTableName, chunk, 'unique_identifier');
    }
  }
}

module.exports = InsightRepository;
