const _                                       = require("lodash");
const axios                                   = require('axios');
const db                                      = require('../data/dbConfig')
const {
  TikTokAppId,
  TikTokAppSecret,
  AuthCode,
  baseUrl
}                                              = require("../constants/tiktok");
const { add }                                 = require("../common/models");


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
const getTikTokCampaigns = (access_token, ad_account_ids, date) => {
  const availableFields = ['campaign_id', 'campaign_name', 'create_time', 'modify_time', 'operation_status', 'advertiser_id', 'budget']
  const additionalParams = availableFields ? {'fields': JSON.stringify(availableFields)} : {};
  additionalParams['creation_filter_start_time'] = date + " 00:00:00";
  // additionalParams['creation_filter_end_time']   = date + " 23:59:59";
  return getTikTokData('campaign', access_token, ad_account_ids, additionalParams);
};

// Ad Groups
const getTikTokAdGroups = (access_token, ad_account_ids, date) => {
  const availableFields = ['campaign_id', 'adgroup_name', 'adgroup_id', 'create_time', 'modify_time', 'operation_status', 'advertiser_id', 'budget']
  const additionalParams = availableFields ? {'fields': JSON.stringify(availableFields)} : {};
  additionalParams['creation_filter_start_time'] = date + " 00:00:00";
  // additionalParams['creation_filter_end_time']   = date + " 23:59:59";
  return getTikTokData('adgroup', access_token, ad_account_ids, additionalParams);
};

// Ads
const getTikTokAds = (access_token, ad_account_ids, date) => {
  const availableFields = ['campaign_id', 'advertiser_id', 'adgroup_id', 'ad_id', 'ad_name', 'operation_status', 'create_time', 'modify_time']
  const additionalParams = availableFields ? {'fields': JSON.stringify(availableFields)} : {};
  additionalParams['creation_filter_start_time'] = date + " 00:00:00";
  // additionalParams['creation_filter_end_time']   = date + " 23:59:59";
  return getTikTokData('ad', access_token, ad_account_ids, additionalParams);
};

// Insights
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


module.exports = {
  getTikTokAdAccounts,
  getTikTokCampaigns,
  getTikTokAdGroups,
  getTikTokAds,
  getTikTokAdInsights,
  getTikTokToken,
  refreshTikTokToken,
  updateAdInsights
};
