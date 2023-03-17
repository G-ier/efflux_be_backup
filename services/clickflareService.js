const _ = require('lodash');
const axios = require('axios');
const db = require('../data/dbConfig');
const { CLICKFLARE_URL, API_KEY } = require('../constants/clickflare');
const { dayHH, dayYMD } = require('../common/day');
const PROVIDERS = require("../constants/providers");

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
  const clickflareData = [];
  let page = 1;
  let pageSize = 1000;
  let next = false;
  do {
    next = false;
    const payload = {
      startDate,
      endDate,
      timezone,
      metrics,
      sortBy: 'ClickTime',
      orderType: 'desc',
      page,
      pageSize
    }

    const { data } = await axios.post(
      `${CLICKFLARE_URL}event-logs`, payload, config);
    if(data.totals.counter > pageSize * page) {
      page++;
      next = true;
    }
    clickflareData.push(...data.items);
  } while(next)
  return clickflareData;
}

/**
 * @name processClickflareData
 * @returns {Promise<Array<object>>}
 */

async function processClickflareFBData(data) {
  return data.filter(item => item.ConnectionReferrer.includes(PROVIDERS.FACEBOOK)).map(item => {
    return {
      ad_id: item.TrackingField1,
      adset_id: item.TrackingField2,
      campaign_id: item.TrackingField3,
      adset_name: item.TrackingField5,
      campaign_name: item.TrackingField6,
      traffic_source: PROVIDERS.FACEBOOK,
      date: dayYMD(item.ClickTime),
      hour: dayHH(item.ClickTime),
      revenue: item.Cost,
      event_type: item.EventType,
      external_id: item.ExternalID,
      flow_id: item.FlowID,
      click_id: item.ClickID,
      click_time: item.ClickTime,
      connection_ip: item.ConnectionIP,
      connection_referrer: item.ConnectionReferrer,
      device_user_agent: item.DeviceUserAgent,
      visit_id: item.VisitID,
      traffic_source_id: item.TrafficSourceID
    }
  })
}

async function processClickflareTTData(data) {
  return data.filter(item => item.ConnectionReferrer.includes(PROVIDERS.TIKTOK)).map(item => {
    return {
      campaign_id: item.TrackingField1,
      campaign_name: item.TrackingField2,
      adset_id: item.TrackingField3,
      adset_name: item.TrackingField4,
      ad_id: item.TrackingField5,
      traffic_source: PROVIDERS.TIKTOK,
      date: dayYMD(item.ClickTime),
      hour: dayHH(item.ClickTime),
      revenue: item.Cost,
      event_type: item.EventType,
      external_id: item.ExternalID,
      flow_id: item.FlowID,
      click_id: item.ClickID,
      click_time: item.ClickTime,
      connection_ip: item.ConnectionIP,
      connection_referrer: item.ConnectionReferrer,
      device_user_agent: item.DeviceUserAgent,
      visit_id: item.VisitID,
      traffic_source_id: item.TrafficSourceID
    }
  })
}

async function updateClickflareTB(data, provider) {
  const fields = ["traffic_source_id","visit_id","device_user_agent", "connection_referrer","connection_ip", "click_time", "click_id", "flow_id", "external_id", "event_type", "revenue", "traffic_source", "campaign_id", "adset_id", "ad_id"];
  const existedClickflare = await db.select("*")
    .from("clickflare")
    .where({traffic_source: provider});
  const existedClickflareMap = _.keyBy(existedClickflare, (item) => {
    return `${item.traffic_source_id}||${item.visit_id}||${item.device_user_agent}||${item.connection_referrer}||${item.connection_ip}||${item.click_time}||${item.click_id}||${item.flow_id}||${item.external_id}||${item.event_type}||${item.revenue}||${item.traffic_source}||${item.campaign_id}||${item.adset_id}||${item.ad_id}`
  });


  const {skipArr = [], createArr = []} = _.groupBy(data, item => {
    const existedClickflare = existedClickflareMap[`${item.traffic_source_id}||${item.visit_id}||${item.device_user_agent}||${item.connection_referrer}||${item.connection_ip}||${item.click_time}||${item.click_id}||${item.flow_id}||${item.external_id}||${item.event_type}||${item.revenue}||${item.traffic_source}||${item.campaign_id}||${item.adset_id}||${item.ad_id}`];
    if (!existedClickflare) return "createArr";
    if (existedClickflare) {
      return "skipArr";
    }
  });

  let result = [];

  if (createArr.length) {
    const created = await db("clickflare").insert(createArr).returning(fields);
    console.log(`CREATED clickflare ${provider} LENGTH`, created.length)
    result.push(...created);
  }

  console.log(`SKIPPED clickflare ${provider} LENGTH`, skipArr.length)
  result.push(...skipArr);
  return result;
}

async function updateClickflareData(startDate, endDate, timezone) {
  const availableFields = await getAvailableFields();
  const metrics = await mapAvailableFields(availableFields);
  const clickflareData = await getclickflareData(startDate, endDate, timezone, metrics);

  // process & save FB data
  const processedCFFBdata = await processClickflareFBData(clickflareData);
  await updateClickflareTB(processedCFFBdata, PROVIDERS.FACEBOOK)
  // process & save TT data
  const processedCFTTdata = await processClickflareTTData(clickflareData);
  await updateClickflareTB(processedCFTTdata, PROVIDERS.TIKTOK)
}
module.exports = { updateClickflareData };
