const _ = require('lodash');
const axios = require('axios');
const db = require('../data/dbConfig');
const { CROSSROADS_URL } = require('../constants/crossroads');
const { todayHH } = require('../common/day');
const PROVIDERS = require("../constants/providers");
const cr_conversionsFields = [
  'traffic_source',
  'crossroads_campaign_id',
  'campaign_id',
  'adset_id',
  'pixel_id',
  'fbclid',
  'section_id',
  'cid',
  'browser',
  'device_type',
  'date',
  'gclid',
  'hour',
  'city',
  'referrer',
  'revenue_clicks',
  'keyword',
  'revenue',
  'request_date',
  'account'
]

/**
 * @name getAvailableFields
 * Returns available fields from Crossroads API <br>
 * Docs for endpoint: <br>
 * https://crossroads.domainactive.com/docs#bulk-data-api-get-available-fields
 * @param {string} key Crossroads API key
 * @returns {Promise<Array<string>>}
 */

async function getAvailableFields(key) {
  const { data } = await axios.get(
    `${CROSSROADS_URL}get-available-fields?key=${key}`,
  );
  return data.available_fields;
}

/**
 * @name prepareBulkData
 * Returns request_id <br>
 * Docs for endpoint: <br>
 * https://crossroads.domainactive.com/docs#bulk-data-api-prepare-bulk-data
 * @param {string} key Crossroads API key
 * @param {string} date date of request format(YYYY-MM-DD)
 * @param {string} fields
 * @returns {Promise<Object>} {request_id: string}
 */

async function prepareBulkData(key, date, fields) {
  const url = `${CROSSROADS_URL}prepare-bulk-data?key=${key}&date=${date}&format=json&extra-fields=${fields}`;
  const { data } = await axios.get(url).catch((err) => {
    console.error('prepare request error', err.response);
    throw err;
  });
  return data;
}

/**
 * @name getRequestState
 * Returns request state <br>
 * Docs for endpoint: <br>
 * https://crossroads.domainactive.com/docs#bulk-data-api-get-request-state
 * @param {string} key Crossroads API key
 * @param {string} requestId
 * @returns {Promise<Object>}
 */

async function getRequestState(key, requestId) {
  const url = `${CROSSROADS_URL}get-request-state?key=${key}&request-id=${requestId}`;
  const { data } = await axios.get(url);
  return data;
}

/**
 * @name getFinalInfo
 * Returns bool report is final <br>
 * Docs for endpoint: <br>
 * https://crossroads.domainactive.com/docs#instant-api-get-final-info
 * @param {string} key Crossroads API key
 * @param {string} date
 * @returns {Promise<Object>}
 */

async function getFinalInfo(key, date) {
  const url = `${CROSSROADS_URL}get-final-info?key=${key}&date=${date}`;
  const { data } = await axios.get(url);
  return data.final;
}

/**
 * @name waitForBulkData
 * Call getRequestState until request state status is SUCCESS and returns file_url to S3 to get data from json
 * @param {string} key Crossroads API key
 * @param {string} requestId
 * @returns {Promise<string>} file_url
 */

function waitForBulkData(key, requestId) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      const { status_code, file_url } = await getRequestState(key, requestId);
      if (status_code !== 200) {
        return;
      }
      clearInterval(interval);
      resolve(file_url);
    }, 5000);
  });
}

/**
 * @name getBulkData
 * Get crossroads data from S3
 * @param {string} url
 * @returns {Promise<Array<Object>>}
 */

async function getBulkData(url) {
  const { data } = await axios.get(url);
  return data;
}

/**
 * @name getCrossroadsCampaigns
 * Get crossroads campaigns by API key
 * @param {string} key Crossroads API key
 * @returns {Promise<Array<Object>>}
 */

async function getCrossroadsCampaigns(key) {
  const { data } = await axios.get(
    `${CROSSROADS_URL}get-campaigns?key=${key}`,
  );
  return data.campaigns;
}

/**
 * @name parseTG2
 * This is necessary to process data which like tg2=facebook_{{campaign_id}}_{{ad_id}}_{{website}}. <br>
 * It splits tg2 param and paste it like it should be. <br>
 * It is only for Facebook data. <br>
 * @param {Object} stat One unit of Crossroads data. There is information about visitors, revenue, conversions etc.
 * @param {RegExp} regex This is necessary in order to check if all values were substituted in tg params right way
 * @returns {Object} It returns initial stat or modified
 */

function parseTG2(stat, regex) {
  if(stat.tg2 && stat.tg2.startsWith(PROVIDERS.FACEBOOK)) {
    const [traffic_source, campaign_id, ad_id] = stat.tg2.split('_');
    return {
      ...stat,
      traffic_source,
      tg2: campaign_id && !regex.test(campaign_id)  ? campaign_id : null,
      tg6: ad_id && !regex.test(ad_id)  ? ad_id : null,
    }
  }
  return stat
}

/**
 * @name parseTGParams
 * This is necessary to process tgParams. <br>
 * Each traffic source has different structure of tgParams <br>
 * Property campaign_id initially is id of crossroads campaign. But it used  like id of ad_campaigns from traffic source.
 * @param {Object} stat One unit of Crossroads stats. There is information about visitors, revenue, conversions etc.
 * @param {RegExp} regex This is necessary in order to check if all values were substituted in tg params right way.
 * @returns {Object} It returns initial stat or modified
 */

function parseTGParams(stat, regex) {
  const traffic_source = getTrafficSource(stat)
  for(const key in stat) {
    stat[key] = !regex.test(stat[key]) ? stat[key] : null
  }
  stat.crossroads_campaign_id = stat.campaign_id
  stat.campaign_id = null
  if(traffic_source === PROVIDERS.FACEBOOK) {
    stat = parseTG2(stat, regex)
    return {
      ...stat,
      traffic_source,
      campaign_id: stat.tg2,
      //NOTE: if tg3 = '{{fbclid}}' real fbclid in gclid property
      fbclid: stat.tg3 || stat.gclid,
      gclid: null,
      pixel_id: stat.tg5,
      adset_id: stat.tg5,
      ad_id:  stat.tg7,
      campaign_name: stat.campaign_number,
      adset_name: stat.tg4
    }
  } else if(traffic_source === PROVIDERS.OUTBRAIN) {
    return {
      ...stat,
      traffic_source,
      campaign_id: stat.tg3,
      section_id: stat.tg5,
      ad_id: stat.tg6,
      cid: stat.tg7
    }
  } else if(traffic_source === PROVIDERS.TIKTOK) {
    return {
      ...stat,
      traffic_source,
      campaign_id: stat.tg2,
      //NOTE: if tg3 = '{{fbclid}}' real fbclid in gclid property
      fbclid: stat.tg3 || stat.gclid,
      gclid: null,
      pixel_id: stat.tg5,
      adset_id: stat.tg5,
      ad_id:  stat.tg7,
      campaign_name: stat.tg1,
      adset_name: stat.tg4
    }
  }
  return {
    ...stat,
    traffic_source,
  }
}

/**
 * @name processTotals
 * Sum all metrics from crossroads.
 * @param {Array<Object>} data Raw data from Crossroads.
 * @returns {Object}
 */

function processTotals(data) {
  const summableFields = [
    'publisher_revenue_amount',
    'lander_searches',
    'lander_visitors',
    'revenue_clicks',
    'total_visitors',
    'tracked_visitors',
    'total_spent',
    'link_clicks',
  ];
  const defaultStats = _.zipObject(summableFields, new Array(summableFields.length).fill(0));
  const totals = { ...defaultStats };

  data.forEach((item) => {
    _(item)
      .pick(summableFields)
      .defaults(defaultStats)
      .forOwn((value, key) => {
        totals[key] += value && typeof value === 'number' ? +(value.toFixed(4)) : 0;
      });
  }, { ...defaultStats });

  return totals;
}

const adsetStatDefaults = {
  total_revenue: 0,
  total_searches: 0,
  total_lander_visits: 0,
  total_revenue_clicks: 0,
  total_visitors: 0,
  total_tracked_visitors: 0,
};

/**
 * @name processCrossroadsData
 * Process crossroads data to acceptable appearance.
 * @param {Array<Object>} data Raw data from Crossroads.
 * @param {string} account Crossroads account id.
 * @param {string} request_date Date of request.
 * @returns {Object}
 */

function processCrossroadsData(data, account, request_date) {
  const regex = new RegExp('^\{.*\}')
  return data.map(click => {
    click = parseTGParams(click, regex)
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
      platform:  !click.platform || click.platform === "0" ? null : click.platform,
      date: click.day || null,
      gclid: click.gclid && click.gclid !== 'null' ? click.gclid : null,
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
    }
  })
}

/**
 * @name aggregateAdsetList
 * Aggregate crossroads data grouped by adset. <br>
 * It is only for Facebook.
 * @param {Array<Object>} adsets=[] Crossroads data grouped by Crossroads.
 * @returns {Object} Aggregated Crossroads data
 */

function aggregateAdsetList(adsets = []) {
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
    ...adsetStatDefaults,
  };

  adsets.forEach((item) => {
    adset.total_revenue += (item.revenue || 0);
    adset.total_searches += (item.lander_searches || 0);
    adset.total_lander_visits += (item.lander_visitors || 0);
    adset.total_revenue_clicks += (item.revenue_clicks || 0);
    adset.total_visitors += (item.total_visitors || 0);
    adset.total_tracked_visitors += (item.tracked_visitors || 0);
  });

  return adset;
}

/**
 * @name processHourlyData
 * @desc Groups adsets by hour and returns list of adsets by hour.
 * @param adsets [Array<Object> = []]
 * @returns Array<Object>
 */
function processHourlyData(adsets) {
  return _(adsets)
    .groupBy('hour')
    .map(aggregateAdsetList)
    .value();
}

/**
 * @name aggregateCrossroadsData
 * @desc Groups adset list by adset_id and hour and returns plain array of adsets.
 * @param {Array<Object>} data Crossroads data.
 * @returns Array<Object>
 */
function aggregateCrossroadsData(data) {
  const chainAdset = _(data).groupBy('adset_id');

  return chainAdset.map((adsets) => {
    return processHourlyData(adsets);
  }).flatten().value();
}

/**
 * @name getTrafficSource
 * Define traffic source from tgParams.
 * @param {Object} stat Crossroads raw data.
 * @returns {string} Traffic source.
 */

function getTrafficSource(stat) {
  if(stat.tg10 === PROVIDERS.FACEBOOK ||
    stat.tg2.startsWith(PROVIDERS.FACEBOOK) ||
    stat.referrer.includes(PROVIDERS.FACEBOOK) ||
    stat.referrer.includes(PROVIDERS.INSTAGRAM) ||
    stat.campaign__name.includes('FB')
  ) return PROVIDERS.FACEBOOK
  if(stat.tg1.startsWith(PROVIDERS.OUTBRAIN) ||
    stat.referrer.includes(PROVIDERS.OUTBRAIN) ||
    stat.campaign__name.includes('OUTB')
  ) return PROVIDERS.OUTBRAIN
  if(stat.campaign__name.includes('TT') ||
    stat.referrer.includes(PROVIDERS.TIKTOK)
  ) return PROVIDERS.TIKTOK
  else {
    return PROVIDERS.UNKNOWN
  }

}

/**
 * @name updateCrossroadsCampaigns
 * Update Crossroads campaigns in DB.
 * @param {string} key Crossroads API key.
 * @returns {Promise<Array<Object>>}
 */

async function updateCrossroadsCampaigns(key) {
  const campaigns = await getCrossroadsCampaigns(key)
  return db("crossroads_campaigns")
    .insert(campaigns.map(item => {return {id: item.id, name: item.name, type: item.type, created_at: item.created_at}}))
    .onConflict("id")
    .merge()
}

function removeAccountData(account, request_date) {
  if (!request_date) return;
  return db('crossroads').where({ account, request_date }).del();
}

function removeAccountConversions(account, request_date) {
  if (!request_date) return;
  return db('cr_conversions').where({ account, request_date }).del();
}

function removeAccountStats(account, request_date) {
  if (!request_date) return;
  return db('crossroads_stats').where({ account, request_date }).del();
}

/**
 * @name updateCrossroadsData
 * Update Crossroads data.
 * @param {Object} account Crossroads account
 * @param {string} request_date date of Crossroads report (YYYY-MM-DD)
 * @returns {Promise<Array<Object>>}
 */

async function updateCrossroadsData(account, request_date) {
  await updateCrossroadsCampaigns(account.key);
  const available_fields = await getAvailableFields(account.key);
  const fields = available_fields.join(',');
  const { request_id } = await prepareBulkData(account.key, request_date, fields);

  const file_url = await waitForBulkData(account.key, request_id);
  // const file_url = 'https://s3-us-west-2.amazonaws.com/cr-api-v2-bulk-data/233afddf-2503-41a6-8d50-5031eb417d1e.json'

  console.log('file_url', file_url);

  const crossroadsData = await getBulkData(file_url);

  const totals = processTotals(crossroadsData);
  console.log('DIRECTLY FROM AWS', totals);

  const processedCrossroadsData = processCrossroadsData(crossroadsData, account.id, request_date)

  const deleted = await removeAccountData(account.id, request_date);
  const deletedConversions = await removeAccountConversions(account.id, request_date);
  const deletedStats = await removeAccountStats(account.id, request_date)

  console.log('DELETED', `${deleted} crossroads from hour ${todayHH()} on date  ${request_date} for ${account.id}`);
  console.log(`DELETED ${deletedConversions} conversion rows from hour ${todayHH()} on date  ${request_date} for ${account.id}`);
  console.log(`DELETED ${deletedStats} stats rows from hour ${todayHH()} on date  ${request_date} for ${account.id}`);

  const aggregatedData = aggregateCrossroadsData(processedCrossroadsData);
  const clicks = _(processedCrossroadsData)
    .filter(item => item.revenue && item.revenue_clicks)
    .map(item => _.pick(item, cr_conversionsFields))
    .value()

  const aggregatedDataChunks = _.chunk(aggregatedData, 500);
  for (const chunk of aggregatedDataChunks) {
    await db('crossroads').insert(chunk);
  }
  const clickChunks = _.chunk(clicks, 500);
  for (const chunk of clickChunks) {
    await db('cr_conversions').insert(chunk);
  }

  const processedChunks = _.chunk(processedCrossroadsData, 500);
  for (const chunk of processedChunks) {
    await db('crossroads_stats').insert(chunk);
  }
}

module.exports = { updateCrossroadsData, getFinalInfo };
