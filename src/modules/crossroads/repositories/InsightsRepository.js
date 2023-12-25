const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");
const _ = require("lodash");
const PROVIDERS = require("../../../shared/constants/providers");
const { isNotNumeric }            = require("../../../shared/helpers/Utils");

class InsightsRepository {

  constructor(database) {
    this.aggregatesTableName = "crossroads";
    this.tableName = "crossroads_raw_insights";
    this.database = database || new DatabaseRepository();
  }

  getTrafficSource(stat) {
    if (
      stat.tg10 === PROVIDERS.FACEBOOK ||
      stat.tg2.startsWith(PROVIDERS.FACEBOOK) ||
      stat.referrer.includes(PROVIDERS.FACEBOOK) ||
      stat.referrer.includes(PROVIDERS.INSTAGRAM) ||
      stat.campaign__name.includes("FB")
    )
      return PROVIDERS.FACEBOOK;
    else if (
      stat.tg1.startsWith(PROVIDERS.OUTBRAIN) ||
      stat.referrer.includes(PROVIDERS.OUTBRAIN) ||
      stat.campaign__name.includes("OUTB")
    )
      return PROVIDERS.OUTBRAIN;
    else if (stat.campaign__name.includes("TT") || stat.referrer.includes(PROVIDERS.TIKTOK)) return PROVIDERS.TIKTOK;
    else if (stat.campaign__name.includes("TB")) {
      return PROVIDERS.TABOOLA;
    }
    else {
      return PROVIDERS.UNKNOWN;
    }
  }

  parseCRApiData(insight, account, request_date) {

    const traffic_source = this.getTrafficSource(insight);

    const [country_code, region, city] = insight.tg7 ? (insight.tg7).replace(" ", "").split('-') : ['Unknown', 'Unknown', 'Unknown'];
    console.log("Traffic source: ", traffic_source);
    console.log("Location data: ", country_code, region, city);
    let [pixel_id, timestamp] = insight.tg9
      ? (insight.tg9).replace(" ", "").split('-')
      : ['Unknown', 'Unknown'];

    if (traffic_source === PROVIDERS.TABOOLA)
      timestamp = insight.tg9
      pixel_id = ''

    let [campaign_id, adset_id, ad_id] = [insight.tg2, insight.tg5, insight.tg6]
    if (isNotNumeric(campaign_id)) campaign_id = 'Unknown';
    if (isNotNumeric(adset_id)) adset_id = 'Unknown';
    if (isNotNumeric(ad_id)) ad_id = 'Unknown';
    const session_id = /^[0-9a-zA-Z]+$/.test(insight.tg3) ? insight.tg3 : 'Unknown';

    if (traffic_source === PROVIDERS.TABOOLA) timestamp = insight.tg9

    return {

      // Timely Data
      date: request_date,
      hour: insight.hour,

      // Crossroads Data
      crossroads_campaign_id: insight.campaign_id,
      cr_camp_name: insight.campaign__name,
      crossroads_campaign_type: insight.campaign__type,
      crossroads_campaign_number: insight.campaign_number,
      category: insight.category,

      // Traffic Source Data
      pixel_id: pixel_id,
      campaign_id: campaign_id,
      campaign_name: insight.tg1 || "Unknown",
      adset_name: "",
      adset_id: adset_id,
      ad_id: ad_id,
      traffic_source: traffic_source,

      // user data
      session_id: session_id,
      ip: insight.tg4,
      country_code: country_code,
      region: region || "Unknown",
      city: city || "Unknown",
      external: insight.tg10,
      timestamp: timestamp,
      user_agent: insight.tg8,

      // conversion Data
      conversions: insight.revenue_clicks || 0,
      revenue: insight.publisher_revenue_amount || 0,
      keyword_clicked: insight.lander_keyword,

      // Reporting Data
      account: account,
      lander_searches: insight.lander_searches || 0,
      lander_visitors: insight.lander_visitors || 0,
      tracked_visitors: insight.tracked_visitors || 0,
      total_visitors: insight.total_visitors || 0,

      // Unique Identifier
      unique_identifier: `${session_id}-${insight.lander_keyword}`,
    };
  }

  aggregateInsights(aggregate, insight) {

    Object.keys(insight).forEach((key) => {
      if (key === 'hour' || key === 'crossroads_campaign_id' || key === 'hour_fetched') {
        aggregate[key] = insight[key];
      } else if (_.isNumber(insight[key])) {
        aggregate[key] = (aggregate[key] || 0) + insight[key];
      } else {
        aggregate[key] = insight[key];  // for other non-numeric fields
      }
    });
  }

  cleanseData(insight) {
    // Remove user specific data from the insight
    const parsedInsight = {...insight};
    delete parsedInsight.session_id;
    delete parsedInsight.ip;
    delete parsedInsight.country_code;
    delete parsedInsight.region;
    delete parsedInsight.city;
    delete parsedInsight.external;
    delete parsedInsight.timestamp;
    delete parsedInsight.user_agent;
    delete parsedInsight.category;
    delete parsedInsight.crossroads_campaign_number;
    delete parsedInsight.crossroads_campaign_type;

    parsedInsight.total_revenue_clicks = parsedInsight.conversions; delete parsedInsight.conversions;
    parsedInsight.total_revenue = parsedInsight.revenue; delete parsedInsight.revenue;
    delete parsedInsight.keyword_clicked;

    parsedInsight.total_searches = parsedInsight.lander_searches || 0; delete parsedInsight.lander_searches;
    parsedInsight.total_lander_visits = parsedInsight.lander_visitors || 0; delete parsedInsight.lander_visitors;
    parsedInsight.total_tracked_visitors = parsedInsight.tracked_visitors || 0; delete parsedInsight.tracked_visitors;

    parsedInsight.hour_fetched = parsedInsight.hour;
    parsedInsight.request_date = parsedInsight.date;

    parsedInsight.unique_identifier = `${parsedInsight.campaign_id}-${parsedInsight.adset_id}-${parsedInsight.ad_id}-${parsedInsight.date}-${parsedInsight.hour}`
    return parsedInsight;
  }

  async processData(data, account, request_date) {

    // Process raw data and aggregated data in a single loop
    const hourlyAdsets = {};
    const rawData = [];
    let hourKey;

    data.forEach((insight) => {

      // Step 1: Parse API Data into a human readable format
      const parsedInsight = this.parseCRApiData(insight, account, request_date);
      // Include in rawData only if the session_id is not Unknown (i.e. came from Funnel Flux)
      if (parsedInsight.session_id != 'Unknown' && !parsedInsight.user_agent.includes('facebookexternalhit')) rawData.push(parsedInsight);

      // Step 2: Aggregate data
      const cleansedInsight = this.cleanseData(parsedInsight);
      if (cleansedInsight.traffic_source === 'taboola'){
        hourKey = `${cleansedInsight.crossroads_campaign_id}-${cleansedInsight.hour}`;
      }
      else{
        hourKey = `${cleansedInsight.adset_id}-${cleansedInsight.hour}`;
      }
      // Aggregate data
      if (hourlyAdsets[hourKey]) {
        this.aggregateInsights(hourlyAdsets[hourKey], cleansedInsight);
      }
      else {
        hourlyAdsets[hourKey] = cleansedInsight;
      }
    });

    return [rawData, Object.values(hourlyAdsets)]
  }

  async upsert(insights, id, request_date, chunkSize = 500) {

    const [rawData, AggregatedData] = await this.processData(insights, id, request_date);

    // Upsert raw user session data
    const dataChunks = _.chunk(rawData, chunkSize);
    for (const chunk of dataChunks) {
      const uniqueChunk = _.uniqBy(chunk, 'unique_identifier');
      await this.database.upsert(this.tableName, uniqueChunk, "unique_identifier");
    }

    // Upsert aggregated data
    const aggregateChunks = _.chunk(AggregatedData, chunkSize);
    for (const chunk of aggregateChunks) {
      await this.database.upsert(this.aggregatesTableName, chunk, "unique_identifier");
    }
  }

  async fetchInsights(fields = ["*"], filters = {}, limit) {
    const results = await this.database.query(this.aggregatesTableName, fields, filters, limit);
    return results.map(this.toDomainEntity);
  }

}

module.exports = InsightsRepository;
