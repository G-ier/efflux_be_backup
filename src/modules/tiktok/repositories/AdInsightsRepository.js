const _ = require("lodash");
const AdInsight = require("../entities/AdInsights");
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");

class AdInsightRepository {

  constructor(database) {
    this.tableName = "tiktok";
    this.database = database || new DatabaseRepository();
  }

  async saveOne(adInsight) {
    const dbObject = this.toDatabaseDTO(adInsight);
    return await this.database.insert(this.tableName, dbObject);
  }

  async saveInBulk(adInsights, chunkSize = 500) {
    let data = adInsights.map((adInsight) => toDatabaseDTO(adInsight));
    let dataChunks = _.chunk(data, chunkSize);
    for (let chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk);
    }
  }

  async upsert(adInsights, adAccountsCampaignIdsMap, chunkSize = 500) {
    const dbObjects = adInsights.map((adInsight) => this.toDatabaseDTO(adInsight, adAccountsCampaignIdsMap));
    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, "unique_identifier");
    }
    return dbObjects;
  }

  async fetchAdInsights(fields = ["*"], filters = {}, limit) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results;
  }

  toDatabaseDTO(adInsight, adAccountsCampaignIdsMap) {
    const datetime = adInsight.dimensions.stat_time_hour;
    const [date, unparsedHour] = datetime.split(" ");
    const hour = unparsedHour.slice(0, 2);

    return {
      date: date,
      campaign_name: adInsight.metrics.campaign_name,
      campaign_id: adInsight.metrics.campaign_id,
      ad_id: adInsight.dimensions.ad_id,
      total_spent: +adInsight.metrics.spend,
      clicks: +adInsight.metrics.clicks,
      cpc: +adInsight.metrics.cpc,
      reporting_currency: adInsight.metrics.currency,
      hour: +(hour.startsWith("0") ? hour.replace("0", "") : hour),
      conversions: +adInsight.metrics.conversion,
      impressions: +adInsight.metrics.impressions,
      adset_id: adInsight.metrics.adgroup_id,
      ad_account_id: adAccountsCampaignIdsMap[adInsight.metrics.campaign_id],
      cpm: +adInsight.metrics.cpm,
      ctr: +adInsight.metrics.ctr,
      unique_identifier: `${adInsight.dimensions.ad_id}-${date}-${hour}`,
    };
  }

  toDomainEntity(dbObject) {
    return new AdInsight(
      dbObject.date,
      dbObject.campaign_name,
      dbObject.campaign_id,
      dbObject.ad_id,
      dbObject.total_spent,
      dbObject.clicks,
      dbObject.cpc,
      dbObject.reporting_currency,
      dbObject.hour,
      dbObject.conversions,
      dbObject.impressions,
      dbObject.adset_id,
      dbObject.ad_account_id,
      dbObject.cpm,
      dbObject.ctr,
      dbObject.unique_identifier
    );
  }

}

module.exports = AdInsightRepository;
