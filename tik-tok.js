
const _                                       = require("lodash");
const axios                                   = require('axios');
const db                                      = require('./data/dbConfig')
const PROVIDERS                               = require("./constants/providers");
const { getUserAccounts }                     = require("./services/userAccountsService");
const { updateAdAccounts }                    = require("./services/adAccountsService");
const { updateCampaigns }                     = require("./services/campaignsService");
const { updateAdsets }                        = require("./services/adsetsService");
const { updateTikTokAds }                     = require("./services/adsService");
const { getAccountAdAccounts }                = require("./services/adAccountsService");
const { getCampaignData }                     = require("./services/campaignsService");
const { add }                                 = require("./common/models");
const calendar                                = require("./common/day");
const CronJob                                 = require("cron").CronJob;

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// CONSTANTS

const TikTokAppId                             = '7241448674398584833';
const TikTokAppSecret                         = 'c071f3fddeff10c8cc39539d4ac3e44a639c7a50'
const AuthCode                                = '977ba1f9721a21e0d1d55f2e644a37fd5c353d74'
const baseUrl                                 = 'https://business-api.tiktok.com/open_api/v1.3'

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// SERVICES

async function upsert(tableName, data, conflictTarget) {
  try {
      const insert = db(tableName).insert(data).toString();
      const conflictKeys = Object.keys(data).map(key => `${key} = EXCLUDED.${key}`).join(', ');
      const query = `${insert} ON CONFLICT (${conflictTarget}) DO UPDATE SET ${conflictKeys}`;

      // Executing the query
      await db.raw(query);
      console.log("Row has been upserted successfully.");

  } catch (error) {
      console.error("Error upserting row: ", error);
  }
}

async function updateAdInsights(data, date) {

  const removeIds = _.map(data, "campaign_id");

  if (removeIds.length) {
    const removed = await db("tiktok").whereIn("campaign_id", removeIds).andWhere({date}).del();
    console.info(`DELETED ${removed} rows on date ${date}`);
  }

  data = [... new Map(data.map(item => [item['campaign_id'] + item['ad_id'] + item['hour'], item])).values()]

  const dataChunks = _.chunk(data, 500);
  for (const chunk of dataChunks) {
    await add("tiktok", chunk);
  }

  // await add("facebook", data);
  console.info(`DONE ADDING TIKTOK DATA 🎉 for ${date}`);

};

// Token Handling
const getTikTokToken = async () => {
  const url = `${baseUrl}/oauth2/access_token/`
  const params = {
    'app_id': TikTokAppId,
    'auth_code': AuthCode,
    'secret': TikTokAppSecret,
  }
  const headers = {
    'Content-Type': 'application/json'
  }
  const res = await axios.post(url, params, { headers })
  if (res.data.code === 0) {
    // Create or update a user account
    const data = {
      'email'       : 'deni.haxhiu13@gmail.com',
      'provider'    : 'tiktok',
      'provider_id' :  res.data.request_id,
      'status'      : 'active',
      'token'       :  res.data.access_token,
      'user_id'     :  1
    }
    upsert('user_accounts', data, 'token')
  } else {
    // Throw error
    throw new Error("Error creating token")
  }
};

// to-do: token refresh
const refreshTikTokToken = async () => {
  throw new Error("Not implemented")
}

// Ad Accounts
const processTikTokAdAccounts = (account, adAccountsData) => {
  return adAccountsData.map(({ name, advertiser_id, balance, timezone, display_timezone}) => ({
    name,
    provider: PROVIDERS.TIKTOK,
    provider_id: advertiser_id,
    status: 'active',
    user_id: account.user_id,
    account_id: account.id,
    fb_account_id: advertiser_id,
    amount_spent: 0,
    balance: balance,
    spend_cap: 0,
    currency: 'USD',
    tz_name: display_timezone,
    tz_offset: timezone.replace(/^\D+/g, '')
  }))
}

const getTikTokAdAccountsInfo = async (access_token, ad_account_ids) => {

  const availableFields = ['telephone_number', 'contacter', 'currency', 'cellphone_number',
    'timezone', 'advertiser_id', 'role', 'company', 'status', 'description', 'rejection_reason',
    'address', 'name', 'language', 'industry', 'license_no', 'email', 'license_url', 'country',
    'balance', 'create_time', 'display_timezone', 'owner_bc_id'
  ]
  const url = `${baseUrl}/advertiser/info?`
  const headers = {
    "Access-Token" : access_token,
  }
  const params = new URLSearchParams({
    'advertiser_ids': JSON.stringify(ad_account_ids),
    'fields': JSON.stringify(availableFields),
  })
  const query = params.toString()
  const res = await axios.get(url + query, { headers })
  if (res.data.code === 0) {
    return res.data.data.list
  }

};

const getTikTokAdAccounts = async (access_token) => {
  const url = `${baseUrl}/oauth2/advertiser/get?`
  const headers = {
    "Access-Token" : access_token,
  }
  const params = new URLSearchParams({
    'app_id': TikTokAppId,
    'secret': TikTokAppSecret,
  })
  const query = params.toString()
  console.log("Query", url + query)
  const res = await axios.get(url + query, { headers })
  if (res.data.code === 0) {

    // Get ad accounts info.
    const adAccountsIds = res.data.data.list.map(({ advertiser_id }) => advertiser_id)
    const adAccountsData = await getTikTokAdAccountsInfo(access_token, adAccountsIds)
    return [adAccountsIds, adAccountsData]
  }
  throw new Error("Error getting ad accounts")
};

// Generalizations
const getTikTokData = async (endpoint, access_token, ad_account_ids, additionalParams = {}) => {
  const url = `${baseUrl}/${endpoint}/get?`;
  const headers = {
    "Access-Token": access_token,
  };

  // Create an array of promises along with ad_account_ids
  const requests = ad_account_ids.map(ad_account_id => {
    const params = new URLSearchParams({
      'advertiser_id': ad_account_id,
      ...additionalParams
    });

    const query = params.toString();
    return {
      ad_account_id,
      promise: axios.get(url + query, { headers })
    };
  });

  // Process each request and its associated ad_account_id
  const allData = [];
  await Promise.all(requests.map(async ({ad_account_id, promise}) => {
    try {
      const res = await promise;
      if (res.data.code === 0) {
        // Accumulate data
        allData.push(...res.data.data.list);
      } else {
        console.log(`Error in fetching ${endpoint} data for account id ${ad_account_id}`);
      }
    } catch (err) {
      console.log(`Error in fetching ${endpoint} data for account id ${ad_account_id}:`, err);
    }
  }));
  return allData; // Return all data
};

// Campaigns
const processTikTokCampaigns = (account, adAccountsMap, campaignsData) => {
  return campaignsData.map(({ campaign_id, campaign_name, create_time, modify_time, operation_status, advertiser_id, budget }) => ({
    id: campaign_id,
    name: campaign_name,
    created_time: create_time,
    updated_time: modify_time,
    traffic_source: PROVIDERS.TIKTOK,
    status: operation_status,
    user_id: account.user_id,
    account_id: account.id,
    ad_account_id: adAccountsMap[advertiser_id].id,
    daily_budget: null,
    lifetime_budget: budget,
    budget_remaining: null,
    network: 'unknown',
  }))
};

const getTikTokCampaigns = (access_token, ad_account_ids, date) => {
  const availableFields = ['campaign_id', 'campaign_name', 'create_time', 'modify_time', 'operation_status', 'advertiser_id', 'budget']
  const additionalParams = availableFields ? {'fields': JSON.stringify(availableFields)} : {};
  additionalParams['creation_filter_start_time'] = date + " 00:00:00";
  additionalParams['creation_filter_end_time']   = date + " 23:59:59";
  return getTikTokData('campaign', access_token, ad_account_ids, additionalParams);
};

// Ad Groups
const processTikTokAdGroups = (account, adAccountsMap, adGroupsData, date) => {
  return adGroupsData.map(({adgroup_name, adgroup_id, create_time, modify_time, operation_status, advertiser_id, budget}) => ({
    name: adgroup_name,
    created_time: create_time,
    updated_time: modify_time,
    traffic_source: PROVIDERS.TIKTOK,
    provider_id: adgroup_id,
    status: operation_status,
    user_id: account.user_id,
    account_id: account.id,
    ad_account_id: adAccountsMap[advertiser_id].id,
    daily_budget: null,
    lifetime_budget: budget,
    budget_remaining: null,
    network: 'unknown',
  }));
}

const getTikTokAdGroups = (access_token, ad_account_ids, date) => {
  const availableFields = ['adgroup_name', 'adgroup_id', 'create_time', 'modify_time', 'operation_status', 'advertiser_id', 'budget']
  const additionalParams = availableFields ? {'fields': JSON.stringify(availableFields)} : {};
  additionalParams['creation_filter_start_time'] = date + " 00:00:00";
  additionalParams['creation_filter_end_time']   = date + " 23:59:59";
  return getTikTokData('adgroup', access_token, ad_account_ids, additionalParams);
};

// Ads
const processTikTokAds = (account, adAccountsMap, adsData) => {
  return adsData.map(({campaign_id, advertiser_id, adgroup_id, ad_id, ad_name, operation_status, create_time, modify_time}) => ({
    id: ad_id,
    name: ad_name,
    created_time: create_time,
    traffic_source: PROVIDERS.TIKTOK,
    provider_id: ad_id,
    status: operation_status,
    user_id: account.user_id,
    account_id: account.id,
    ad_account_id: adAccountsMap[advertiser_id].id,
    campaign_id: campaign_id,
    ad_group_id: adgroup_id,
    network: 'unknown'
  }))
}

const getTikTokAds = (access_token, ad_account_ids, date) => {
  const availableFields = ['campaign_id', 'advertiser_id', 'adgroup_id', 'ad_id', 'ad_name', 'operation_status', 'create_time', 'modify_time']
  const additionalParams = availableFields ? {'fields': JSON.stringify(availableFields)} : {};
  additionalParams['creation_filter_start_time'] = date + " 00:00:00";
  additionalParams['creation_filter_end_time']   = date + " 23:59:59";
  return getTikTokData('ad', access_token, ad_account_ids, additionalParams);
};

// Insights
const processTikTokAdInsights = (adAccountsCampaignIdsMap, insightsData) => {

  return insightsData.map((item) => {
    const datetime = item.dimensions.stat_time_hour;
    const [date, unparsedHour] = datetime.split(' ');
    const hour = unparsedHour.slice(0, 2)

    return {
      date: date,
      campaign_name: item.metrics.campaign_name,
      campaign_id: item.metrics.campaign_id,
      ad_id: item.dimensions.ad_id,
      total_spent: +item.metrics.spend,
      clicks: +item.metrics.clicks,
      cpc: +item.metrics.cpc,
      reporting_currency: item.metrics.currency,
      hour: +(hour.startsWith('0') ? hour.replace('0', '') : hour),
      conversions: +item.metrics.conversion,
      impressions: +item.metrics.impressions,
      adset_id: item.metrics.adgroup_id,
      ad_account_id: adAccountsCampaignIdsMap[item.metrics.campaign_id],
      cpm: +item.metrics.cpm,
      ctr: +item.metrics.ctr,
    }

  });
};

const getTikTokAdInsights = async (access_token, ad_account_ids, date) => {

  const apiMetrics = JSON.stringify([
    "spend", "currency",
    "campaign_id", "campaign_name",
    "adgroup_id", "adgroup_name",
    "ad_name",
    "impressions", "cpm", "clicks", "cpc", "ctr", "conversion"
  ]);

  const additionalParams = {
    'report_type': 'BASIC',
    'dimensions': JSON.stringify(["ad_id", "stat_time_hour"]),
    'data_level': 'AUCTION_AD',
    'start_date': date,
    'end_date': date,
    'metrics' : apiMetrics,
  };

  return getTikTokData('report/integrated', access_token, ad_account_ids, additionalParams);
};

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// CONTROLLERS
const updateTikTokData = async (date) => {
  const accounts = await getUserAccounts(PROVIDERS.TIKTOK);
  if (accounts.length === 0) throw new Error("No accounts found for tik-tok")
  const account = accounts[0];

  const [adAccountsIds, tikTokAdAccounts] = await getTikTokAdAccounts(account.token);
  const adAccountsMap = _(await updateAdAccounts(account, processTikTokAdAccounts(account, tikTokAdAccounts))).keyBy("provider_id").value();

  const dataMap = [
      { name: "CAMPAIGN", getData: getTikTokCampaigns, processData: processTikTokCampaigns, updateData: updateCampaigns },
      { name: "ADSET", getData: getTikTokAdGroups, processData: processTikTokAdGroups, updateData: updateAdsets },
      { name: "AD", getData: getTikTokAds, processData: processTikTokAds, updateData: updateTikTokAds }
  ];

  for (const { name, getData, processData, updateData } of dataMap) {

    const data = await getData(account.token, adAccountsIds, date);
    console.log(`${name}S FROM API: `, data.length);
    const processedData = processData(account, adAccountsMap, data);
    const dataChunks = _.chunk(processedData, 100);
    for (const chunk of dataChunks) {
        await updateData(chunk, PROVIDERS.TIKTOK);
    }

  }
};

const updateTikTokInsights = async (date) => {
  const accounts = await getUserAccounts(PROVIDERS.TIKTOK);
  if (accounts.length === 0) throw new Error("No accounts found for tik-tok")
  const account = accounts[0];

  const adAccountsCampaignIdsMap = {};
  const adAccounts       = await getAccountAdAccounts(account.id);
  const adAccountsIds    = adAccounts.map((item) => item.provider_id);
  const campaignData     = await getCampaignData({ ad_account_id: adAccounts.map((item) => item.id) }, ["id", "ad_account_id"]);
  campaignData.forEach((item) => {
    adAccountsCampaignIdsMap[item.id] = item.ad_account_id;
  });

  const insights = await getTikTokAdInsights(account.token, adAccountsIds, date);
  console.log("INSIGHTS FROM API: ", insights.length);
  const processedInsights = processTikTokAdInsights(adAccountsCampaignIdsMap, insights);
  console.log("PROCESSED INSIGHTS: ", processedInsights);
  const insightsChunks = _.chunk(processedInsights, 100);
  for (const chunk of insightsChunks) {
    await updateAdInsights(chunk, date);
  }

};

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Cron Jobs

async function updateTikTokInsightsJob(day) {

  let date;
  // Update the insights for today, yesterday and tomorrow
  if (day === "today") {
    date = calendar.yesterdayYMD(null, 'UTC');
    await updateTikTokInsights(date);
    date = calendar.todayYMD('UTC');
    await updateTikTokInsights(date);
    date = calendar.tomorrowYMD(null, 'UTC');
    await updateTikTokInsights(date);
  } else if (day === "yesterday") {
    date = calendar.yesterdayYMD(null, 'UTC');
    await updateTikTokInsights(date);
    date = calendar.dayBeforeYesterdayYMD(null, 'UTC');
    await updateTikTokInsights(date);
  }
  await updateTikTokData(calendar.todayYMD())
  // Either create spreadsheets or populate the dashboard
}

updateTikTokInsightsJob('today')
