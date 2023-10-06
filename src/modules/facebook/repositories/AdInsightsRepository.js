const _ = require("lodash");
const AdInsight = require("../entities/AdInsights");
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");

class AdInsightRepository {

  constructor(database) {
      this.tableName = "facebook";
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
        await this.database.upsert(this.tableName, chunk, "unique_identifier");
    }
    return dbObjects;
  }

  async fetchAdInsights(fields = ['*'], filters = {}, limit) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results;
  }

  toDatabaseDTO(adInsight) {

    const date = adInsight.date_start;
    const hour = adInsight.hourly_stats_aggregated_by_advertiser_time_zone.slice(0, 2);
    const conversions = adInsight?.actions?.find((i) => i.action_type === "offsite_conversion.fb_pixel_purchase")?.value;
    const lead = adInsight?.actions?.find((i) => i.action_type === "offsite_conversion.fb_pixel_lead")?.value;

    return {
      ad_account_id: adInsight.account_id,
      ad_id: adInsight.ad_id,
      adset_id: adInsight.adset_id,
      campaign_id: adInsight.campaign_id,
      campaign_name: adInsight.campaign_name,
      date,
      hour: +(hour.startsWith("0") ? hour.replace("0", "") : hour),
      impressions: adInsight?.impressions ?? 0,
      link_clicks: adInsight?.inline_link_clicks ?? 0,
      total_spent: adInsight?.spend ?? 0,
      cpc: adInsight?.cpc ?? 0,
      reporting_currency: adInsight.account_currency,
      conversions: _.isNaN(Number(conversions)) ? 0 : Number(conversions),
      clicks: _.isNaN(Number(adInsight?.clicks)) ? 0 : Number(adInsight?.clicks),
      events: JSON.stringify(adInsight.actions),
      lead: _.isNaN(Number(lead)) ? 0 : Number(lead),
      unique_identifier: `${adInsight.ad_id}-${date}-${hour}`,
    };
  }

  toDomainEntity(dbObject) {
    return new AdInsight(
      dbObject.ad_account_id,
      dbObject.ad_id,
      dbObject.adset_id,
      dbObject.campaign_id,
      dbObject.campaign_name,
      dbObject.date,
      dbObject.hour,
      dbObject.impressions,
      dbObject.link_clicks,
      dbObject.total_spent,
      dbObject.cpc,
      dbObject.reporting_currency,
      dbObject.conversions,
      dbObject.clicks,
      dbObject.events,
      dbObject.lead,
      dbObject.unique_identifier
    );
  }

}

module.exports = AdInsightRepository;
