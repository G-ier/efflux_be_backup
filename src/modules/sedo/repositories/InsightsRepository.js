// Third party imports
const _ = require("lodash");

// Local application imports
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");
const Insights = require("../entities/Insights");


class InsightsRepository {

  // We might need to do some processing on the data, aggregate it, etc.

  constructor() {
    this.tablename = "sedo";
    this.database = new DatabaseRepository();
  }

  async saveOne(insight) {
    const dbObject = this.toDatabaseDTO(insight);
    return await this.database.insert(this.tablename, dbObject);
  }

  async saveInBulk(insights, chunkSize = 500) {
    let data = insights.map((insight) => this.toDatabaseDTO(insight))
    let dataChunks = _.chunk(data, chunkSize)
    for (let chunk of dataChunks) {
      await this.database.insert(this.tablename, chunk)
    }
  }

  async update(data, criteria) {
    await this.database.update(this.tablename, data, criteria);
  }

  async delete(criteria) {
    await this.database.delete(this.tablename, criteria);
  }

  async upsert(insights, date, chunkSize = 500) {

    const data = insights.map((insight) => this.toDatabaseDTO(insight, date))
    const dataChunks = _.chunk(data, chunkSize)
    for (let chunk of dataChunks) {
      const inserChunk = _.uniqBy(chunk, 'unique_identifier')
      await this.database.upsert(this.tablename, inserChunk, 'unique_identifier')
    }
  }

  async fetchInsights(fields = ["*"], filters = {}, limit) {
    const results = await this.database.query(this.tablename, fields, filters, limit);
    return results.map(this.toDomainEntity);
  }

  toDatabaseDTO(insight, date) {
    const domain = insight.domain[0]._;

    const funnel_id = insight.c1[0]?._ ? insight.c1[0]._ : '';
    const [campaign_id, adset_id, ad_id, traffic_source] = insight.c2[0]?._ ? (insight.c2[0]._).replace(" ", "").split('|') : ['', '', '', ''];
    const hit_id = insight.c3[0]?._ ? insight.c3[0]._ : '';

    const visitors = insight.uniques[0]._ ? parseInt(insight.uniques[0]._) : 0;
    const clicks = insight.clicks[0]._ ? parseInt(insight.clicks[0]._) : 0;
    const earnings = insight.earnings[0]._ ? parseFloat(insight.earnings[0]._) : 0;

    // In case the following data don't pass from the traffic_source that means that the click
    // isn't organic. So we discard it.
    // if (traffic_source === 'facebook' && (
    //   campaign_id === '{{campaign.id}}' && adset_id === '{{adset.id}}' && ad_id === '{{ad.id}}'
    // )) return null;
    // else if (traffic_source === 'tiktok' && (
    //   campaign_id === '__CAMPAIGN_ID__' && adset_id === '__AID__' && ad_id === '__CID__'
    // )) return null;

    return {
      date,
      domain,
      traffic_source,
      campaign_id,
      adset_id,
      ad_id,
      funnel_id,
      hit_id,
      visitors,
      clicks,
      revenue: earnings,
      unique_identifier: `${date}_${domain}_${campaign_id}_${adset_id}_${ad_id}_${hit_id}`,
    }
  }

  toDomainEntity(dbObject) {
    throw new Error("Not implemented. Please implement this method after creating the table!");
    return new Insights(dbObject);
  }

}

module.exports = InsightsRepository;
