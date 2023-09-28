const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");
const Insights = require("../entities/Insights");
const { todayHH } = require("../helpers");
const _ = require("lodash");
const PROVIDERS = require("../../../shared/constants/providers");

class InsightsRepository {
  constructor(database) {
    this.tableName = "crossroads";
    this.partitionedTableName = "crossroads_partitioned";
    this.database = database || new DatabaseRepository();
  }

  async saveOne(insight) {
    const dbObject = this.toDatabaseDTO(insight);
    await this.database.insert(this.tableName, dbObject);
    return await this.database.insert(this.partitionedTableName, dbObject);
  }

  async saveInBulk(insights, chunkSize = 500) {
    let data = insights.map((insight) => this.toDatabaseDTO(insight));
    let dataChunks = _.chunk(data, chunkSize);
    for (let chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk);
    }
  }

  async update(data, criteria) {
    await this.database.update(this.tableName, data, criteria);
    return await this.database.update(this.partitionedTableName, data, criteria);
  }

  async delete(criteria) {
    await this.database.delete(this.tableName, criteria);
    return await this.database.delete(this.partitionedTableName, criteria);
  }

  async upsert(insights, id, request_date, chunkSize = 500) {
    const dbObjects = this.toDatabaseDTO(insights, id, request_date);
    const dataChunks = _.chunk(dbObjects, chunkSize);
    let insrt_total = { cr: 0, cr_p: 0 };

    for (const chunk of dataChunks) {
      // Upsert into the main table
      await this.database.upsert(this.tableName, chunk, "unique_identifier");
      insrt_total["cr"] += chunk.length;
    }
  }

  async fetchInsights(fields = ["*"], filters = {}, limit) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results.map(this.toDomainEntity);
  }

  aggregateAdsetList(adsets = []) {
    const adsetStatDefaults = {
      total_revenue: 0,
      total_searches: 0,
      total_lander_visits: 0,
      total_revenue_clicks: 0,
      total_visitors: 0,
      total_tracked_visitors: 0,
    };

    const element = adsets[0] || {};
    const adset = {
      crossroads_campaign_id: element.crossroads_campaign_id,
      campaign_id: element.campaign_id,
      campaign_name: element.campaign_name,
      cr_camp_name: element.cr_camp_name,
      adset_name: element.adset_name,
      adset_id: element.adset_id,
      pixel_id: element.pixel_id,
      traffic_source: element.traffic_source,
      ad_id: element.ad_id,
      hour: element.hour,
      date: element.date,
      hour_fetched: todayHH(),
      request_date: element.request_date,
      account: element.account,
      unique_identifier: element.unique_identifier,
      ...adsetStatDefaults,
    };

    adsets.forEach((item) => {
      adset.total_revenue += item.revenue || 0;
      adset.total_searches += item.lander_searches || 0;
      adset.total_lander_visits += item.lander_visitors || 0;
      adset.total_revenue_clicks += item.revenue_clicks || 0;
      adset.total_visitors += item.total_visitors || 0;
      adset.total_tracked_visitors += item.tracked_visitors || 0;
    });

    return adset;
  }

  processHourlyData(adsets) {
    return _(adsets).groupBy("hour").map(this.aggregateAdsetList).value();
  }

  aggregateCrossroadsData(data) {
    const chainAdset = _(data).groupBy("adset_id");

    return chainAdset
      .map((adsets) => {
        return this.processHourlyData(adsets);
      })
      .flatten()
      .value();
  }

  parseTG2(stat, regex) {
    if (stat.tg2 && stat.tg2.startsWith(PROVIDERS.FACEBOOK)) {
      const [traffic_source, campaign_id, ad_id] = stat.tg2.split("_");
      return {
        ...stat,
        traffic_source,
        tg2: campaign_id && !regex.test(campaign_id) ? campaign_id : null,
        tg6: ad_id && !regex.test(ad_id) ? ad_id : null,
      };
    }
    return stat;
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
    if (
      stat.tg1.startsWith(PROVIDERS.OUTBRAIN) ||
      stat.referrer.includes(PROVIDERS.OUTBRAIN) ||
      stat.campaign__name.includes("OUTB")
    )
      return PROVIDERS.OUTBRAIN;
    if (stat.campaign__name.includes("TT") || stat.referrer.includes(PROVIDERS.TIKTOK)) return PROVIDERS.TIKTOK;
    else {
      return PROVIDERS.UNKNOWN;
    }
  }

  parseTGParams(stat, regex) {
    const traffic_source = this.getTrafficSource(stat);
    for (const key in stat) {
      stat[key] = !regex.test(stat[key]) ? stat[key] : null;
    }
    stat.crossroads_campaign_id = stat.campaign_id;
    stat.campaign_id = null;
    if (traffic_source === PROVIDERS.FACEBOOK) {
      stat = this.parseTG2(stat, regex);
      return {
        ...stat,
        traffic_source,
        campaign_id: stat.tg2,
        //NOTE: if tg3 = '{{fbclid}}' real fbclid in gclid property
        fbclid: stat.tg3 || stat.gclid,
        gclid: null,
        pixel_id: stat.tg5,
        adset_id: stat.tg5,
        ad_id: stat.tg7,
        campaign_name: stat.campaign_number,
        adset_name: stat.tg4,
      };
    } else if (traffic_source === PROVIDERS.OUTBRAIN) {
      return {
        ...stat,
        traffic_source,
        campaign_id: stat.tg3,
        section_id: stat.tg5,
        ad_id: stat.tg6,
        cid: stat.tg7,
      };
    } else if (traffic_source === PROVIDERS.TIKTOK) {
      return {
        ...stat,
        traffic_source,
        campaign_id: stat.tg2,
        //NOTE: if tg3 = '{{fbclid}}' real fbclid in gclid property
        fbclid: stat.tg3 || stat.gclid,
        gclid: null,
        pixel_id: stat.tg5,
        adset_id: stat.tg5,
        ad_id: stat.tg7,
        campaign_name: stat.tg1,
        adset_name: stat.tg4,
      };
    }
    return {
      ...stat,
      traffic_source,
    };
  }

  toDatabaseDTO(data, account, request_date) {
    const regex = new RegExp("^{.*}");
    const proccesedData = data.map((click) => {
      click = this.parseTGParams(click, regex);
      return {
        crossroads_campaign_id: click.crossroads_campaign_id || null,
        campaign_id: click.campaign_id || null,
        campaign_name: click.campaign_name || null,
        cr_camp_name: click.campaign__name || null,
        adset_name: click.adset_name || null,
        adset_id: click.adset_id || null,
        section_id: click.section_id || null,
        ad_id: click.ad_id || null,
        pixel_id: click.pixel_id || null,
        traffic_source: click.traffic_source || PROVIDERS.UNKNOWN,
        fbclid: click.fbclid || null,
        cid: click.cid || null,
        browser: !click.browser || click.browser === "0" ? null : click.browser,
        device_type: click.device_type || null,
        platform: !click.platform || click.platform === "0" ? null : click.platform,
        date: click.day || null,
        gclid: click.gclid && click.gclid !== "null" ? click.gclid : null,
        hour: click.hour,
        city: click.city || null,
        country_code: click.country_code || null,
        referrer: click.referrer || null,
        revenue_clicks: click.revenue_clicks || 0,
        revenue: click.publisher_revenue_amount || 0,
        lander_searches: click.lander_searches || 0,
        lander_visitors: click.lander_visitors || 0,
        tracked_visitors: click.tracked_visitors || 0,
        total_visitors: click.total_visitors || 0,
        keyword: click.lander_keyword || null,
        account: account,
        request_date: request_date,
        unique_identifier: `${click.campaign_id}-${click.adset_id}-${click.ad_id}-${request_date}-${click.hour}`,
      };
    });
    return this.aggregateCrossroadsData(proccesedData);
  }

  toDomainEntity(dbObject) {
    return new Insights(
      dbObject.id,
      dbObject.date,
      dbObject.campaign_id,
      dbObject.ad_id,
      dbObject.total_revenue,
      dbObject.total_searches,
      dbObject.total_lander_visits,
      dbObject.total_revenue_clicks,
      dbObject.total_visitors,
      dbObject.total_tracked_visitors,
      dbObject.hour_fetched,
      dbObject.created_at,
      dbObject.updated_at,
      dbObject.hour,
      dbObject.pixel_id,
      dbObject.account,
      dbObject.adset_id,
      dbObject.crossroads_campaign_id,
      dbObject.request_date,
      dbObject.campaign_name,
      dbObject.adset_name,
      dbObject.traffic_source,
      dbObject.cr_camp_name,
      dbObject.unique_identifier,
    );
  }
}

module.exports = InsightsRepository;
