const _ = require("lodash");
const axios = require("axios");
const async = require("async");
const {ServiceUnavailable} = require('http-errors');
const db = require("../data/dbConfig");
const {FB_API_URL, fieldsFilter, delay} = require("../constants/facebook");
const {add} = require("../common/models");

async function getAdAccount(adAccountId, token) {
  const url = `${FB_API_URL}act_${adAccountId}?access_token=${token}&fields=${fieldsFilter}`;
  const account = await axios.get(url).catch((err) => {
    throw new ServiceUnavailable(err.response?.data.error || err);
  });
  return account.data;
}

async function getAdAccounts(userId, token) {
  // TODO replace the hard-coded userid below with userId once we decide best way to handle that
  const url = `${FB_API_URL}${userId}/adaccounts?fields=${fieldsFilter}&access_token=${token}&limit=10000`;
  const accountsResponse = await axios.get(url).catch((err) => {
    console.info("ERROR GETTING FACEBOOK AD ACCOUNTS", err.response?.data.error || err);
    return null;
  });

  if (!accountsResponse) return [];

  return accountsResponse.data.data;
}

async function getAdAccountsTodaySpent(access_token, Ids, date) {
  const isPreset = !/\d{4}-\d{2}-\d{2}/.test(date);
  const dateParam = isPreset
    ? {date_preset: date}
    : {time_range: {since: date, until: date}};

  const fields = "spend,account_id";

  const allSpent = await async.mapLimit(Ids, 100, async (adSetId) => {
    console.log('ad_account_ID', adSetId)
    let paging = {}
    const spent = []
    let url = `${FB_API_URL}${adSetId}/insights`
    let params = {
      fields,
      ...dateParam,
      access_token,
      limit: 5000,
    }
    do {
      if (paging?.next) {
        url = paging.next
        params = {}
      }
      const {data = []} = await axios.get(url, {
        params
      }).catch((err) => {
        console.warn(`facebook get today spent failure for ad_account ${adSetId}`, err.response?.data ?? err);
        return {}
      })
      paging = {...data?.paging}
      if (data?.data?.length) spent.push(...data?.data)
    } while(paging?.next)    
    return spent
  });

  return _.flatten(allSpent);
}

async function getAdInsights(access_token, adArray, date) {
  const isPreset = !/\d{4}-\d{2}-\d{2}/.test(date);
  const dateParam = isPreset
    ? {date_preset: date}
    : {time_range: {since: date, until: date}};

  const fields = "account_id,ad_id,adset_id,inline_link_clicks,campaign_id,date_start,date_stop,impressions,spend,cpc,ad_name,adset_name,campaign_name,account_currency,conversions,actions";

  const allInsights = await async.mapLimit(adArray, 100, async (adSetId) => {    
    let paging = {}
    const insights = []
    let url = `${FB_API_URL}${adSetId}/insights`
    let params = {
      fields,
      level: "ad",
      breakdowns: "hourly_stats_aggregated_by_advertiser_time_zone",
      ...dateParam,
      access_token,
      limit: 500,
    }
    do {
      if (paging?.next) {
        url = paging.next
        params = {}        
      }
      const {data = []} = await axios.get(url, {
        params
      }).catch((err) => {
        console.warn(`facebook insights failure for ad_account ${adSetId}`, err.response?.data ?? err);
        return {}
      })
      paging = {...data?.paging}
      if (data?.data?.length) insights.push(...data?.data)
      await delay(1000);
    } while(paging?.next)
    // console.log('insights.length', insights.length)
    return insights.length ? cleanInsightsData(insights) : [];
  });

  return _.flatten(allInsights);
}

async function getAdInsightsByDay(access_token, adArray, date) {
  const isPreset = !/\d{4}-\d{2}-\d{2}/.test(date);
  const dateParam = isPreset
    ? {date_preset: date}
    : {time_range: {since: date, until: date}};

  const fields = "ad_id,adset_id,campaign_id,date_start,actions,cost_per_action_type";

  const allInsights = await async.mapLimit(adArray, 100, async (adSetId) => {    
    let paging = {}
    const insights = []
    let url = `${FB_API_URL}${adSetId}/insights`
    let params = {
      fields,
      level: "ad",
      ...dateParam,
      access_token,
      limit: 500,
    }
    do {
      if (paging?.next) {
        url = paging.next
        params = {}
      }
      const {data = []} = await axios.get(url, {
        params
      }).catch((err) => {
        // console.warn(`facebook insights failure for ad_account ${adSetId}`, err.response?.data ?? err);
        return {}
      })
      paging = {...data?.paging}
      if (data?.data?.length) insights.push(...data?.data)
      await delay(1000);
    } while(paging?.next)
    // console.log('insights.length', insights.length)
    return insights.length ? cleanInsightsData(insights) : [];
  });

  return _.flatten(allInsights);
}

// FB's Insights API will not return certain keys if there is no value associated with them - e.g.,
// it will not return "spend":0 if no spend, it just won't include the key 'spend' with the
// return object. To avoid problems when inserting into DB, this function adds the keys back
// to the object with appropiate values.
const defaultInsightsStats = {
  campaign_name: "No name",
  spend: 0,
  inline_link_clicks: 0,
  cpc: 0,
  conversions: [{action_type: "default", value: "0"}],
  ctr: 0,
  impressions: 0,
};

const defaultDBStats = {
  total_spent: 0,
  link_clicks: 0,
  conversions: 0,
  impressions: 0,
};

function cleanInsightsData(result) {
  return result.map((item) => _.defaults(item, defaultInsightsStats));
}

async function addFacebookData(data, date) {
  const removeIds = _.map(data, "campaign_id");

  if (removeIds.length) {
      const removed = await db("facebook").whereIn("campaign_id", removeIds).andWhere({date}).del();
    console.info(`DELETED ${removed} rows on date ${date}`);
  }
  // console.log('data', data)
  data = [... new Map(data.map(item => [item['campaign_id'] + item['ad_id'] + item['hour'], item])).values()]

  await add("facebook", data);
  console.info(`DONE ADDING FACEBOOK DATA 🎉 for ${date}`);

}

async function addFacebookDataByDay(data, date) {
  const removeIds = _.map(data, "campaign_id");

  if (removeIds.length) {
      const removed = await db("facebook_conversion").whereIn("campaign_id", removeIds).andWhere({date}).del();
    console.info(`DELETED ${removed} rows on date ${date}`);
  }
  data = [... new Map(data.map(item => [item['campaign_id'], item])).values()]
  await add("facebook_conversion", data);
  console.info(`DONE ADDING FACEBOOK DATA 🎉 for ${date}`);

}

async function getAdCampaigns(access_token, adAccountIds, date = "today") {
  const isPreset = !/\d{4}-\d{2}-\d{2}/.test(date);
  const dateParam = isPreset
    ? {date_preset: date}
    : {time_range: {since: date, until: date}};

  const fields = "id,account_id,ad_strategy_id,status,name,daily_budget,lifetime_budget,created_time,start_time,stop_time,budget_remaining,updated_time";

  const allCampaigns = await async.mapLimit(adAccountIds, 100, async (adAccountId) => {
    const url = `${FB_API_URL}${adAccountId}/campaigns`;
    const response = await axios.get(url, {
      params: {
        fields,
        ...dateParam,
        access_token,
        limit: 10000,
      }
    })
      .catch((err) => 
      // console.warn('ad_account_id:', adAccountId, "facebook campaigns failure", err.response?.data ?? err)
      console.warn()
      );

    return response?.data?.data || [];
  });

  return _.flatten(allCampaigns);
}

async function getFacebookPixels(access_token, adAccountIds) {
  const fields = 'id,name,account_id,owner_business,is_unavailable,last_fired_time,creation_time,data_use_setting,ad_'
  const allPixels = await async.mapLimit(adAccountIds, 100, async (adAccountId) => {
    const url = `${FB_API_URL}${adAccountId}/adspixels`;
    const response = await axios.get(url, {
      params: {
        fields,
        access_token,
        limit: 5000,
      }
    })
      .catch((err) => console.warn('ad_account_id:', adAccountId, "facebook pixels failure", err.response?.data ?? err));

    return response?.data?.data.map(item => ({...item, ad_account_id: adAccountId.replace('act_', '')})) || [];
  });

  return _.flatten(allPixels);
}

async function getAdCampaignIds(adsetIds) {
  const fields = ["adset_id", "campaign_id"];
  const data = await db("facebook").whereIn("adset_id", adsetIds).returning(fields);

  return _.keyBy(data, "adset_id");
}

async function getAdsets(access_token, adAccountIds, date) {
  const isPreset = !/\d{4}-\d{2}-\d{2}/.test(date);
  const dateParam = isPreset
    ? {date_preset: date}
    : {time_range: {since: date, until: date}};

  const fields = "id,account_id,campaign_id,status,name,daily_budget,lifetime_budget,created_time,start_time,stop_time,budget_remaining,updated_time";

  const allAdsets = await async.mapLimit(adAccountIds, 100, async (adAccountId) => {
    const url = `${FB_API_URL}${adAccountId}/adsets`;
    const response = await axios.get(url, {
      params: {
        fields,
        ...dateParam,
        access_token,
        limit: 5000,
      }
    })
      .catch((err) => console.warn(`facebook adsets failure on ad_account_id ${adAccountId}`, err.response?.data ?? err));

    return response?.data?.data || []
  })

  return _.flatten(allAdsets);
}

module.exports = {
  getAdAccount,
  getAdAccounts,
  addFacebookData,
  addFacebookDataByDay,
  getAdInsights,
  getAdInsightsByDay,
  getAdsets,
  getAdCampaigns,
  getAdCampaignIds,
  getFacebookPixels,
  getAdAccountsTodaySpent,
};
