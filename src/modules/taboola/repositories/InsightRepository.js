const _ = require("lodash");
const CampaignInsight = require("../entities/CampaignInsights");
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");

class InsightRepository {

  constructor(database) {
      this.tableName = "taboola";
      this.database = database || new DatabaseRepository();
  }

  async saveOne(adInsight) {
      const dbObject = this.toDatabaseDTO(adInsight);
      return await this.database.insert(this.tableName, dbObject);
  }

  async saveInBulk(adInsights, chunkSize = 500) {
    let data = adInsights.map((adInsight) => toDatabaseDTO(adInsight))
    let dataChunks = _.chunk(data, chunkSize)
    for (let chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk)
    }
  }

  async upsert(adInsights, chunkSize = 500) {
    const dbObjects = adInsights.map((adInsight) => this.toDatabaseDTO(adInsight));
    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
        await this.database.upsert(this.tableName, chunk, "unique_id");
    }
    return dbObjects;
  }

  async fetchAdInsights(fields = ['*'], filters = {}, limit) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results;
  }

  toDatabaseDTO(insight) {
    return {
      date: insight.date,
      hour: insight.hour,
      campaign: insight.campaign_id,
      campaign_name: insight.campaign_name,
      clicks: insight.link_clicks,
      impressions: insight.impressions,
      visible_impressions: insight.visible_impressions,
      spent: insight.total_spent,
      conversions_value: insight.conversions_value,
      roas: insight.roas,
      ctr: insight.ctr,
      vctr: insight.vctr,
      cpm: insight.cpm,
      vcpm: insight.vcpm,
      cpc: insight.cpc,
      campaigns_num: insight.campaigns_num,
      cpa: insight.cpa,
      cpa_clicks: insight.cpa_clicks,
      cpa_views: insight.cpa_views,
      cpa_actions_num: insight.conversions,
      cpa_actions_num_from_clicks: insight.cpa_actions_num_from_clicks,
      cpa_actions_num_from_views: insight.cpa_actions_num_from_views,
      cpa_conversion_rate: insight.cpa_conversion_rate,
      cpa_conversion_rate_clicks: insight.cpa_conversion_rate_clicks,
      cpa_conversion_rate_views: insight.cpa_conversion_rate_views,
      currency: insight.reporting_currency,
      unique_id: `${insight.campaign_id}-${insight.date}-${insight.hour}`,
    };
  }

  toDomainEntity(dbObject) {
    return new CampaignInsight({
      date: dbObject.date,
      hour: dbObject.hour,
      campaign_id: dbObject.campaign_id,
      campaign_name: dbObject.campaign_name,
      clicks: dbObject.link_clicks,
      impressions: dbObject.impressions,
      visible_impressions: dbObject.visible_impressions,
      spent: dbObject.total_spent,
      conversions_value: dbObject.conversions_value,
      roas: dbObject.roas,
      ctr: dbObject.ctr,
      vctr: dbObject.vctr,
      cpm: dbObject.cpm,
      vcpm: dbObject.vcpm,
      cpc: dbObject.cpc,
      campaigns_num: dbObject.campaigns_num,
      cpa: dbObject.cpa,
      cpa_clicks: dbObject.cpa_clicks,
      cpa_views: dbObject.cpa_views,
      cpa_actions_num: dbObject.conversions,
      cpa_actions_num_from_clicks: dbObject.cpa_actions_num_from_clicks,
      cpa_actions_num_from_views: dbObject.cpa_actions_num_from_views,
      cpa_conversion_rate: dbObject.cpa_conversion_rate,
      cpa_conversion_rate_clicks: dbObject.cpa_conversion_rate_clicks,
      cpa_conversion_rate_views: dbObject.cpa_conversion_rate_views,
      currency: dbObject.reporting_currency,
  });
  }

}

module.exports = InsightRepository;
