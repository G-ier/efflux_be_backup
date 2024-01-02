// Third party imports
const _ = require('lodash');

// Local application imports
const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');
const Insights = require('../entities/Insights');
const { isNotNumeric } = require('../../../shared/helpers/Utils');

class InsightsRepository {
  // We might need to do some processing on the data, aggregate it, etc.

  constructor() {
    this.tablename = 'sedo';
    this.database = new DatabaseRepository();
  }

  async update(data, criteria) {
    await this.database.update(this.tablename, data, criteria);
  }

  async delete(criteria) {
    await this.database.delete(this.tablename, criteria);
  }

  aggregateByUniqueIdentifier(dataList) {
    // Group by unique_identifier
    const groupedData = _.groupBy(dataList, 'unique_identifier');

    // Reduce each group by merging them together
    const mergedData = _.map(groupedData, (group) => {
      return group.reduce((acc, current) => {
        Object.keys(current).forEach((key) => {
          if (key === 'hour') {
            acc[key] = current[key]; // keep the hour value from the last item in the group
          } else if (_.isNumber(current[key])) {
            acc[key] = (acc[key] || 0) + current[key];
          } else {
            acc[key] = current[key]; // for other non-numeric fields
          }
        });
        return acc;
      }, {});
    });

    return mergedData;
  }

  processSedoInsights(insights, date) {
    const databaseDTOInsights = insights.map((insight) => this.parseSedoAPIData(insight, date));
    const aggregatedInsights = this.aggregateByUniqueIdentifier(databaseDTOInsights);
    return aggregatedInsights;
  }

  async upsert(insights, chunkSize = 500) {
    const dataChunks = _.chunk(insights, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tablename, chunk, 'unique_identifier');
    }
  }

  async fetchInsightsForCompilation(date) {
    const query = `
      SELECT
        date,
        hour,
        domain,
        traffic_source,
        campaign_id,
        adset_id,
        ad_id,
        pb_visits,
        pb_conversions,
        pb_revenue,
        revenue,
        unique_identifier,
        CONCAT(campaign_id, '-', adset_id, '-', ad_id, '-', date) as date_level_matching_identifier
      FROM
        sedo
      WHERE
        date = '${date}'
    `
    const results = await this.database.raw(query)
    return results.rows
  }

  async fetchInsights(fields = ['*'], filters = {}, limit) {
    const cache = true;
    // If not in cache, fetch from the database
    const results = await this.database.query(this.tablename, fields, filters, limit, [], cache);
    return results
  }

  parseSedoAPIData(insight, date) {

    const domain = insight.domain[0]._;
    const user_agent = insight.c1[0]?._ ? insight.c1[0]._ : 'Unknown';
    let [pixel_id, campaign_id, adset_id, ad_id, traffic_source, external] = insight.c2[0]?._ ? insight.c2[0]?._.split('_|_') : ['Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown'];
    let [ip, country_code, region, city, timestamp, campaign_name, session_id] = insight.c3[0]?._ ? (insight.c3[0]?._).split('_|_') : ['Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown'];

    if (isNotNumeric(campaign_id)) campaign_id = 'Unkown';
    if (isNotNumeric(adset_id)) adset_id = 'Unkown';
    if (isNotNumeric(ad_id)) ad_id = 'Unkown';
    if (!['tiktok', 'facebook'].includes(traffic_source)) traffic_source = 'Unkown';

    const visitors = insight.uniques[0]._ ? parseInt(insight.uniques[0]._) : 0;
    const conversions = insight.clicks[0]._ ? parseInt(insight.clicks[0]._) : 0;
    const revenue = insight.earnings[0]._ ? parseFloat(insight.earnings[0]._) : 0;

    return {
      date,
      domain,
      traffic_source,
      campaign_id,
      adset_id,
      ad_id,
      campaign_name,
      adset_name: '',
      ad_name: '',
      visitors,
      conversions,
      revenue: revenue,
      unique_identifier: `${campaign_id}-${adset_id}-${ad_id}-${date}`,
    };
  }

  toDomainEntity(dbObject) {
    throw new Error('Not implemented. Please implement this method after creating the table!');
    return new Insights(dbObject);
  }
}

module.exports = InsightsRepository;
