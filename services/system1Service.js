const _ = require('lodash');
const axios = require('axios');
const db = require('../data/dbConfig');
const {SYSTEM1_BASE_URL, SYSTEM1_MIRROR} = require('../constants/system1');
const moment = require('moment-timezone');
const {getCampaignNames} = require("./campaignsService");
const {threeDaysAgoYMD} = require("../common/day");

const AUTH_KEY = process.env.SYSTEM1_AUTH_KEY;

async function getHourlyData(days) {
  const url = `${SYSTEM1_BASE_URL}/v2/subid_estimated_hourly.json`

  try {
    const { data } = await axios.get(url, {
      params: {
        days,
        auth_key: AUTH_KEY
      }
    })

    return data.subids;
  } catch (e) {
    console.log(e.message);
  }
}

async function getDailyData(days) {
  const url = `${SYSTEM1_BASE_URL}/v2/subid.json`

  try {
    const { data } = await axios.get(url, {
      params: {
        days,
        auth_key: AUTH_KEY
      }
    })

    return data;
  } catch (e) {
    console.log(e);
  }
}

async function updateData(data, date) {
  const existedData = await db.select('*').from('system1')
   .whereRaw('date >= ?', [date])

  const existedDataMap = _.keyBy(existedData, ({sub_id, campaign, date, hour}) => {
    return `${sub_id}||${campaign}||${date} ${hour}`;
  });

  const {skipArr = [], updateArr = [], createArr = []} = _.groupBy(data, item => {
    const key = `${item.sub_id}||${item.campaign}||${item.date} ${item.hour}`
    const existedSystem = existedDataMap[key];
    if (!existedSystem) return 'createArr';
    if (existedSystem) {
      if (existedSystem.revenue !== item.revenue ||
        existedSystem.clicks !== item.clicks ||
        existedSystem.searches !== item.searches ||
        existedSystem.total_visitors !== item.total_visitors
      ) return 'updateArr';
      return 'skipArr';

    }
  });

  let result = {
    created: 0,
    updated: 0,
    skipped: 0,
  };

  if (createArr.length) {
    const created = await db('system1').insert(createArr);
    result.created = created.rowCount;
  }

  if (updateArr.length) {
    const updated = await Promise.all(
      updateArr.map(item => {
        return db('system1')
          .where({sub_id: item.sub_id, date: item.date, hour: item.hour}).first()
          .update({
            revenue: item.revenue,
            clicks: item.clicks,
            searches: item.searches,
            total_visitors: item.total_visitors,
          }).returning('id')
      })
    );
    result.updated = updated.length;
  }

  result.skipped = skipArr.length;

  console.log(`ADDED ${result.created} ROWS FROM SYSTEM1`);
  console.log(`UPDATED ${result.updated} ROWS FROM SYSTEM1`);
  console.log(`SKIPPED ${result.skipped} ROWS FROM SYSTEM1`);

  return result;
}

function processHourlyData(data) {
  return data.map(item => {
    const { campaign_id, adset_id, ad_id } = processSubId(item.sub_id);
    const date = moment(item.utc_hour).format('YYYY-MM-DD')
    const hour = moment(item.utc_hour).format('H')
    return {
      campaign_id,
      adset_id,
      ad_id,
      date,
      hour: +hour,
      searches: item.searches,
      clicks: item.clicks,
      revenue: item.estimated_revenue,
      sub_id: item.sub_id,
      campaign: item.campaign,
      total_visitors: null,
      utc_hour: item.utc_hour,
      last_updated: item.last_updated
    }
  })
}

function processDailyData(data) {
  const [keys, ...arr] = data;
  let result = []

  for(let item of arr) {
    const elem = {}
    keys.map((key, index) => {
      const newKey = SYSTEM1_MIRROR[key]
      if(!newKey) return false
      return elem[newKey] = item[index]
    })
    result.push(elem)
  }
  return result.map(item => {
    const { campaign_id, adset_id, ad_id } = processSubId(item.sub_id);
    return {
      ...item,
      campaign_id,
      adset_id,
      ad_id,
      hour: 24,
    }
  })
}

function processSubId(sub_id) {
  const result = sub_id.split('|').join(',').split(':').join(',').split(',').filter(item => item !== '0');
  return {
    campaign_id: result?.[0] ?? null,
    adset_id: result?.[1] ?? null,
    ad_id: result?.[2] ?? null,
  }
}

async function updateSystem1Hourly() {
  try {
    let hourlyData = await getHourlyData(2);
    hourlyData = processHourlyData(hourlyData);

    const campaignIds = hourlyData.map(i => i.campaign_id);
    const campaignNames = await getCampaignNames(campaignIds);
    hourlyData = hourlyData.map(item => {
      return {
        ...item,
        campaign_name: campaignNames[item.campaign_id]?.name ?? null
      };
    });

    await updateData(hourlyData, threeDaysAgoYMD(null, 'UTC'));
  } catch (e) {
    console.log(e);
  }
}

async function updateSystem1Daily() {
  try {
    let dailyData = await getDailyData(1);
    dailyData = processDailyData(dailyData);
    const campaignIds = dailyData.map(i => i.campaign_id).filter(i => i);
    const campaignNames = await getCampaignNames(campaignIds);
    dailyData = dailyData.map(item => {
      return {
        ...item,
        campaign_name: campaignNames[item.campaign_id]?.name ?? null
      };
    });
    await updateData(dailyData, threeDaysAgoYMD(null, 'UTC'));
  } catch (e) {
    console.log(e);
  }
}

module.exports = {
  getHourlyData,
  updateData,
  processHourlyData,
  getDailyData,
  processDailyData,
  updateSystem1Hourly,
  updateSystem1Daily
}
