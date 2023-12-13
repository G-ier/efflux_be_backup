// Third Party Imports
const _                           = require("lodash");

// Local Imports
const DatabaseRepository          = require("../../../shared/lib/DatabaseRepository");
const { isNotNumeric }            = require("../../../shared/helpers/Utils");

class InsightsRepository {

  constructor() {
    this.tableName = "tonic_raw_insights";
    this.aggregatesTableName = "tonic"
    this.database = new DatabaseRepository();
  }

  async fetchInsights(fields = ["*"], filters = {}, limit) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results;
  }

  cleanseData(insight) {
    // Remove user specific data from the insight
    const cleansedCopy = {...insight}
    delete cleansedCopy.click_timestamp;
    delete cleansedCopy.ip;
    delete cleansedCopy.country_code;
    delete cleansedCopy.region;
    delete cleansedCopy.city;
    delete cleansedCopy.session_id;
    delete cleansedCopy.keyword_clicked;
    cleansedCopy.unique_identifier = `${insight.campaign_id}-${insight.adset_id}-${insight.ad_id}-${insight.hour}-${insight.date}`;
    return cleansedCopy;
  }

  aggregateInsights(aggregate, insight) {
    // Aggregate the data from the insight into the aggregate object

    Object.keys(insight).forEach((key) => {
      if (key === 'hour' || key === 'tonic_campaign_id') {
        aggregate[key] = insight[key];
      } else if (_.isNumber(insight[key])) {
        aggregate[key] = (aggregate[key] || 0) + insight[key];
      } else {
        aggregate[key] = insight[key];  // for other non-numeric fields
      }
    });
  }

  parseTonicAPIData(insight) {
    // Extract meaningful data from the raw API response of our parameter mapping

    const hour = insight.timestamp.split(' ')[1].split(':')[0];

    let [campaign_name, adset_name, ad_name] = insight.subid1 ? (insight.subid1).replace(" ", "").split('_|_') : ['Unknown', 'Unknown', 'Unknown'];
    let [campaign_id, adset_id, ad_id, traffic_source] = insight.subid2 ? (insight.subid2).replace(" ", "").split('|') : ['Unknown', 'Unknown', 'Unknown', 'Unknown'];

    if (isNotNumeric(campaign_id)) campaign_id = 'Unknown';
    if (isNotNumeric(adset_id)) adset_id = 'Unknown';
    if (isNotNumeric(ad_id)) ad_id = 'Unknown';
    if (!['tiktok', 'facebook'].includes(traffic_source)) traffic_source = 'Unknown';

    let [ip, country_code, region, city] = insight.subid4 ? (insight.subid4).replace(" ", "").split('-') : ['Unknown', 'Unknown', 'Unknown', 'Unknown'];
    const session_id = insight.subid3 ? insight.subid3 : 'Unknown';

    return {

      date: insight.date,
      hour: parseInt(hour),
      click_timestamp: insight.timestamp,

      // Tonic Data
      tonic_campaign_id: insight.campaign_id ? parseInt(insight.campaign_id): null,
      tonic_campaign_name: insight.campaign_name,
      ad_type: insight.adtype,
      advertiser: insight.advertiser,
      template: insight.template,

      // Traffic Source Data
      campaign_id: campaign_id,
      campaign_name: campaign_name,
      adset_id: adset_id,
      adset_name: adset_name,
      ad_id: ad_id,
      ad_name: ad_name,
      traffic_source: traffic_source,

      // User Data
      session_id: session_id,
      ip: ip,
      country_code: country_code,
      region: region,
      city: city,

      // Conversion Data
      conversions: insight.clicks ? parseInt(insight.clicks) : 0,
      revenue: insight.revenueUsd ? parseFloat(insight.revenueUsd) : 0,
      keyword_clicked: insight.keyword,
      revenue_type: insight.revenue_type || 'Unknown',

      // Identifier
      unique_identifier: `${insight.timestamp}-${insight.keyword}-${session_id}`
    }

  }

  processTonicData(data) {
    // Process raw data and aggregated data in a single loop
    const hourlyAdsets = {};
    const rawData = []
    data.forEach((insight) => {

      // Save raw data
      const parsedInsight = this.parseTonicAPIData(insight);
      rawData.push(parsedInsight);

      // Clean insight data
      const cleansedInsight = this.cleanseData(parsedInsight);
      const adsetHourKey = `${cleansedInsight.adset_id}-${cleansedInsight.hour}`;

      // Aggregate data
      if (hourlyAdsets[adsetHourKey]) {
        this.aggregateInsights(hourlyAdsets[adsetHourKey], cleansedInsight);
      } else {
        hourlyAdsets[adsetHourKey] = cleansedInsight;
      }

    })
    return [rawData, Object.values(hourlyAdsets)]
  }

  async upsert(insights, chunkSize = 500) {

    // Process Tonic Data
    const [rawData, adsetAggregatedData] = this.processTonicData(insights);

    // Upsert raw user session data
    const dataChunks = _.chunk(rawData, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, "unique_identifier");
    }

    // Upsert aggregate data
    const aggregateChunks = _.chunk(adsetAggregatedData, chunkSize);
    for (const chunk of aggregateChunks) {
      await this.database.upsert(this.aggregatesTableName, chunk, "unique_identifier");
    }

  }

}

module.exports = InsightsRepository;
