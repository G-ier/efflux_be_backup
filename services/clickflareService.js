const _ = require('lodash');
const axios = require('axios');
const db = require('../data/dbConfig');
const { CLICKFLARE_URL, API_KEY } = require('../constants/clickflare');
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
 * Returns available fields from Clickflare API <br>
 * Docs for endpoint: <br>
 * https://documenter.getpostman.com/view/1342820/2s8YRnnsPW
 * @returns {Promise<Array<object>>}
 */

async function getAvailableFields() {
  const config = {
    headers: {
      'api-key':API_KEY,
      'accept': 'application/json, text/plain, */*'
    }
  }
  const { data } = await axios.get(
    `${CLICKFLARE_URL}event-logs/columns`, config);
  return data;
}

/**
 * @name mapAvailableFields
 * @returns {Promise<Array<string>>}
 */
async function mapAvailableFields(fields) {
  let fieldsMap = [];
  fields.forEach(field => {
    fieldsMap = fieldsMap.concat(field.original.children)
  })
  return fieldsMap.map(field => field.original.field);
}


/**
 * @name getclickflareData
 * Get clickflare event-logs <br>
 * Docs for endpoint: <br>
 * https://documenter.getpostman.com/view/1342820/2s8YRnnsPW
 * @returns {Promise<Array<object>>}
 */

async function getclickflareData(startDate, endDate, timezone, metrics) {
  const config = {
    headers: {
      'api-key':API_KEY,
      'authority': 'api.clickflare.io',
      'accept': 'application/json, text/plain, */*',
      'accept-language': 'en-US,en;q=0.9,sq;q=0.8,fr;q=0.7,am;q=0.6',
      'content-type': 'application/json;charset=UTF-8'
    }
  }
  const payload = {
    startDate,
    endDate,
    timezone,
    metrics,
    sortBy: 'ClickTime',
    orderType: 'desc',
    page: 1,
    pageSize: 1000
  }
  const { data } = await axios.post(
    `${CLICKFLARE_URL}event-logs`, payload, config);
  return data.items;
}

/**
 * @name processClickflareData
 * @returns {Promise<Array<object>>}
 */

async function processClickflareData(data) {
  return data.filter(item => item.EventType == 'conversion').map(item => {
    return {
      ad_id: item.TrackingField1,
      adset_id: item.TrackingField2,
      campaign_id: item.TrackingField3,
      adset_name: item.TrackingField5,
      campaign_name: item.TrackingField6,
      traffic_source: item.TrackingField7
    }
  })
}

async function updateClickflareData(startDate, endDate, timezone) {
  const availableFields = await getAvailableFields();
  const metrics = await mapAvailableFields(availableFields);
  const clickflareData = await getclickflareData(startDate, endDate, timezone, metrics);
  const processedCFdata = await processClickflareData(clickflareData);
}
module.exports = { updateClickflareData };
