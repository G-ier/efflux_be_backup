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

  aggregateInsights(aggregate, insight) {

    Object.keys(insight).forEach((key) => {
      if (key === 'hour' || key === 'crossroads_campaign_id') {
        aggregate[key] = insight[key];
      } else if (_.isNumber(insight[key])) {
        aggregate[key] = (aggregate[key] || 0) + insight[key];
      } else {
        aggregate[key] = insight[key];  // for other non-numeric fields
      }
    });
  }

  parseData(insight, account, request_date){
    const regex = new RegExp("^{.*}");
    const parsedInsight = this.parseTGParams(insight, regex);
    return {
      // identifier
      unique_identifier: `${parsedInsight.timestamp}-${parsedInsight.keyword}-${parsedInsight.session_id}`,
      hour: parsedInsight.hour,

      // crossroads data
      crossroads_campaign_id: parsedInsight.crossroads_campaign_id || null,
      cr_camp_name: parsedInsight.campaign__name || null,
      crossroads_campaign_type: parsedInsight.campaign__type || null,

      // user data
      user_agent: parsedInsight.user_agent || null,
      city: parsedInsight.city || null,
      country_code: parsedInsight.country_code || null,
      region: parsedInsight.region || null,
      ip: parsedInsight.ip || null,

      // traffic source Data
      campaign_id: parsedInsight.campaign_id || null,
      campaign_name: parsedInsight.campaign_name || null,
      adset_name: parsedInsight.adset_name || null,
      adset_id: parsedInsight.adset_id || null,
      ad_id: parsedInsight.ad_id || null,
      traffic_source: parsedInsight.traffic_source || PROVIDERS.UNKNOWN,

      // conversion Data
      session_id: parsedInsight.session_id || null,
      conversions: parsedInsight.revenue_clicks || 0,
      revenue: parsedInsight.publisher_revenue_amount || 0,
      timestamp: parsedInsight.timestamp || null,
      click_id: parsedInsight.click_id || null,
      keyword: parsedInsight.keyword || null,

      // Reporting Data
      pixel_id: parsedInsight.pixel_id || null,
      account: account,
      // section_id: parsedInsight.section_id || null,
      // ad_id: parsedInsight.ad_id || null,
      // pixel_id: parsedInsight.pixel_id || null,

      // date: request_date,
      // hour: parsedInsight.hour,

      // browser: !parsedInsight.browser || parsedInsight.browser === "0" ? null : parsedInsight.browser,
      // device_type: parsedInsight.device_type || null,
      // keyword: parsedInsight.lander_keyword || null,
      // fbclid: parsedInsight.fbclid || null,
      // cid: parsedInsight.cid || null,
      // gclid: parsedInsight.gclid && parsedInsight.gclid !== "null" ? parsedInsight.gclid : null,
      // platform: !parsedInsight.platform || parsedInsight.platform === "0" ? null : parsedInsight.platform,
      // revenue_parsedInsights: parsedInsight.revenue_parsedInsights || 0,

      // revenue: parsedInsight.publisher_revenue_amount || 0,
      // revenue_clicks: parsedInsight.revenue_clicks || 0,
      lander_searches: parsedInsight.lander_searches || 0,
      lander_visitors: parsedInsight.lander_visitors || 0,
      tracked_visitors: parsedInsight.tracked_visitors || 0,
      total_visitors: parsedInsight.total_visitors || 0,

      // account: account,
      // request_date: request_date,

      // // identifier
      // unique_identifier: `${parsedInsight.campaign_id}-${parsedInsight.adset_id}-${parsedInsight.ad_id}-${request_date}-${parsedInsight.hour}`
    };
  }

  cleanseData(insight) {
    // Remove user specific data from the insight
    const cleansedCopy = {
      crossroads_campaign_id: insight.crossroads_campaign_id,
      campaign_id: insight.campaign_id,
      campaign_name: insight.campaign_name,
      cr_camp_name: insight.cr_camp_name,
      adset_name: insight.adset_name,
      adset_id: insight.adset_id,
      pixel_id: insight.pixel_id,
      traffic_source: insight.traffic_source,
      ad_id: insight.ad_id,
      hour: insight.hour,
      date: insight.date,
      hour_fetched: todayHH(),
      request_date: insight.date,
      account: insight.account,
      unique_identifier: `${insight.campaign_id}-${insight.adset_id}-${insight.ad_id}-${insight.date}-${insight.hour}`,
      

      total_revenue: insight.revenue,
      total_searches : insight.lander_searches,
      total_lander_visits : insight.lander_visitors,
      total_revenue_clicks : insight.conversions,
      total_visitors : insight.total_visitors,
      total_tracked_visitors : insight.tracked_visitors,
    }
    return cleansedCopy;
  }

  async processData(data, account, request_date){
      // Process raw data and aggregated data in a single loop
    const hourlyAdsets = {}; 
    const rawData = [];
    let hourKey;
    data.forEach((insight) => {

      const parsedInsight = this.parseData(insight, account, request_date);
      console.log(parsedInsight);
      if(parsedInsight.traffic_source === 'taboola'){
        rawData.push(parsedInsight);
        
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
    }
  });

  return [rawData, Object.values(hourlyAdsets)]
}



  async testUpsert(insights, id, request_date, chunkSize = 500) {
    const [rawData, AggregatedData] = await this.processData(insights, id, request_date);

    console.log(rawData);
    console.log(AggregatedData);
        // Upsert raw user session data
    const dataChunks = _.chunk(rawData, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert("crossroads_raw_insights", chunk, "unique_identifier");
    }

    const aggregateChunks = _.chunk(AggregatedData, chunkSize);
    for (const chunk of aggregateChunks) {
      await this.database.upsert(this.tableName, chunk, "unique_identifier");
    }
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

  async saveRawData(data, account, request_date, campaignIdRestrictions) {

    const convertToDatabaseDTO = (data, account, request_date) => {

      return data.map((item) => {

        delete item.day; delete item.tqs;
        item.account = account;
        item.date = request_date;
        item.traffic_source = this.getTrafficSource(item);

        // session_id-lander_keyword
        item.unique_identifier = `${item.tg3}-${item.lander_keyword}`
        return item;
      })
    }

    data = data.filter((item) => item.tg3 !== "{{fbclid}}" && item.tg3 !== '');

    if (campaignIdRestrictions && campaignIdRestrictions.length > 0) {
      data = data.filter((item) => campaignIdRestrictions.includes(item.tg2));
    }

    const dbObjects = convertToDatabaseDTO(data, account, request_date);
    const dataChunks = _.chunk(dbObjects, 500);

    for (const chunk of dataChunks) {
      const parsedChunk = _.uniqBy(chunk, "unique_identifier");
      await this.database.upsert("raw_crossroads_data", parsedChunk, "unique_identifier", ['reported_to_ts']);
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
    const chainAdset = _(data).groupBy(item => ( item.traffic_source === 'taboola' ? item.campaign_id : item.adset_id));
    
    return chainAdset
      .map((adsets) => {
        return this.processHourlyData(adsets);
      })
      .flatten()
      .value();
  }

  parseTG2(stat, regex) {
    // The tg2 never starts with 'facebook' so this logic is always neglected, therefore
    // is redundant.
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
    else if (
      stat.tg1.startsWith(PROVIDERS.OUTBRAIN) ||
      stat.referrer.includes(PROVIDERS.OUTBRAIN) ||
      stat.campaign__name.includes("OUTB")
    )
      return PROVIDERS.OUTBRAIN;
    else if (stat.campaign__name.includes("TT") || stat.referrer.includes(PROVIDERS.TIKTOK)) return PROVIDERS.TIKTOK;
    else if (stat.campaign__name.includes("TB")) {
      // console.log(stat);
      return PROVIDERS.TABOOLA;
    }
    else {
      return PROVIDERS.UNKNOWN;
    }
  }

  parseTGParams(stat, regex) {

    // Label the traffic source. To do this, we rely on Crossroads Campaign Naming convention
    // Basically we're vulnerable to human error for it. If the campaign name contains FB, we
    // assume it's Facebook. If it contains OUTB, we assume it's Outbrain. If it contains TT, we
    // assume it's TikTok. Otherwise, we assume it's unknown.
    const traffic_source = this.getTrafficSource(stat);

    // If tokens from traffic source (only Facebook) fail to convert and they're
    // send over the API as {{fbclid}} we set them to null
    for (const key in stat) {
      stat[key] = !regex.test(stat[key]) ? stat[key] : null;
    }

    stat.crossroads_campaign_id = stat.campaign_id;
    stat.campaign_id = null;

    // Then, based on the traffic source label, we parse the tokens
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
    else if (traffic_source === PROVIDERS.TABOOLA){
      const [country, city, region] = stat.tg6.split('-');
      return{
        ...stat,
        campaign_name: stat.tg1,
        campaign_id: stat.tg2,
        session_id: stat.tg3,
        ip: stat.tg4,
        ad_id: stat.tg5,
        country_code: country,
        city: city,
        region: region,
        traffic_source,
        user_agent: stat.tg7,
        timestamp: stat.tg8,
        click_id: stat.tg10,
        traffic_source: traffic_source,
        unique_identifier: `${stat.timestamp}-${stat.keyword}-${stat.tg3}`
      }
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
        date: request_date,
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
        unique_identifier: `${click.campaign_id}-${click.adset_id}-${click.ad_id}-${request_date}-${click.hour}`
      };
    });
    // When we aggregate at an adset hourly level, plenty data it lost in aggregatiosn.
    // e.g fbclid, gclid, hour, city, country_code, referrer, keyword, etc.
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
      dbObject.unique_identifier
    );
  }

}

module.exports = InsightsRepository;
