const _ = require("lodash");
const axios = require("axios");
const async = require("async");
const { ServiceUnavailable } = require("http-errors");
const db = require("../data/dbConfig");
const { FB_API_URL, fieldsFilter, delay, availableStatuses } = require("../constants/facebook");
const { add } = require("../common/models");
const { sendSlackNotification } = require("./slackNotificationService");

let sent = 0;
const max_sent = 1;

async function debugToken(admin_token, access_token) {
  const url = `${FB_API_URL}debug_token?access_token=${admin_token}&input_token=${access_token}`;
  let res = null;
  try {
    const response = await axios.get(url);
    res = response.data.data;
  } catch (err) {
    console.info("ERROR GETTING OWNED AD ACCOUNTS", err.response?.data.error || err);
    return ["", false];
  }

  if (res.is_valid) {
    const diffTime = Math.abs(new Date() - new Date(res.expires_at * 1000));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    console.log("Token expires in", diffDays, "days");

    const provider_id = res.user_id;
    let username = await db.raw(`
      SELECT name FROM user_accounts WHERE provider_id = '${provider_id}';
    `);

    username = username.rows[0].name;

    if (diffDays < 4) {
      if (sent < max_sent) {
        await sendSlackNotification(
          `Facebook API Token of user ${username} is about to expire in ${diffDays} days, please refresh it.`
        );
        sent++;
      }
    }
    return [username, res.is_valid];
  } else {
    console.log("Token is not valid");
    return ["", false];
  }
}

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

// DEAD FUNCTIONS
async function getAdAccountsTodaySpent(access_token, Ids, date) {
  const isPreset = !/\d{4}-\d{2}-\d{2}/.test(date);
  const dateParam = isPreset ? { date_preset: date } : { time_range: { since: date, until: date } };

  const fields = "spend,account_id";

  const allSpent = await async.mapLimit(Ids, 100, async (adSetId) => {
    console.log("ad_account_ID", adSetId);
    let paging = {};
    const spent = [];
    let url = `${FB_API_URL}${adSetId}/insights`;
    let params = {
      fields,
      ...dateParam,
      access_token,
      limit: 5000,
    };
    do {
      if (paging?.next) {
        url = paging.next;
        params = {};
      }
      const { data = [] } = await axios
        .get(url, {
          params,
        })
        .catch((err) => {
          console.warn(`facebook get today spent failure for ad_account ${adSetId}`, err.response?.data ?? err);
          return {};
        });
      paging = { ...data?.paging };
      if (data?.data?.length) spent.push(...data?.data);
    } while (paging?.next);
    return spent;
  });

  return _.flatten(allSpent);
}

async function getAdInsights(access_token, adArray, date) {
  const isPreset = !/\d{4}-\d{2}-\d{2}/.test(date);
  const dateParam = isPreset ? { date_preset: date } : { time_range: { since: date, until: date } };

  const fields =
    "account_id,ad_id,adset_id,inline_link_clicks,campaign_id,date_start,date_stop,impressions,clicks,reach,frequency,spend,cpc,ad_name,adset_name,campaign_name,account_currency,conversions,actions";

  const allInsights = await async.mapLimit(adArray, 100, async (adSetId) => {
    let paging = {};
    const insights = [];
    let url = `${FB_API_URL}${adSetId}/insights`;
    let params = {
      fields,
      level: "ad",
      breakdowns: "hourly_stats_aggregated_by_advertiser_time_zone",
      ...dateParam,
      access_token,
      limit: 500,
    };
    do {
      if (paging?.next) {
        url = paging.next;
        params = {};
      }
      const { data = [] } = await axios
        .get(url, {
          params,
        })
        .catch((err) => {
          console.warn(`facebook insights failure for ad_account ${adSetId}`, err.response?.data ?? err);
          return {};
        });
      paging = { ...data?.paging };
      if (data?.data?.length) insights.push(...data?.data);
      await delay(1000);
    } while (paging?.next);

    // Debug & Development Logs
    // if (insights[0]) console.log('insights1', insights[0]);
    // if (insights[1]) console.log('insights2', insights[1]);
    // if (insights[2]) console.log('insights3', insights[2]);
    // console.log("Inside getAdInsights logs: ", insights)
    return insights.length ? cleanInsightsData(insights) : [];
  });

  return _.flatten(allInsights);
}

async function getAdInsightsByDay(access_token, adArray, date) {
  const isPreset = !/\d{4}-\d{2}-\d{2}/.test(date);
  const dateParam = isPreset ? { date_preset: date } : { time_range: { since: date, until: date } };

  const fields = "ad_id,adset_id,campaign_id,date_start,actions,cost_per_action_type";

  const allInsights = await async.mapLimit(adArray, 100, async (adSetId) => {
    let paging = {};
    const insights = [];
    let url = `${FB_API_URL}${adSetId}/insights`;
    let params = {
      fields,
      level: "ad",
      ...dateParam,
      access_token,
      limit: 500,
    };
    do {
      if (paging?.next) {
        url = paging.next;
        params = {};
      }
      const { data = [] } = await axios
        .get(url, {
          params,
        })
        .catch((err) => {
          // console.warn(`facebook insights failure for ad_account ${adSetId}`, err.response?.data ?? err);
          return {};
        });
      paging = { ...data?.paging };
      if (data?.data?.length) insights.push(...data?.data);
      await delay(1000);
    } while (paging?.next);
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
  conversions: [{ action_type: "default", value: "0" }],
  ctr: 0,
  impressions: 0,
  clciks: 0,
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

// This should be part of the repository
async function addFacebookData(data, date) {
  const removeIds = _.map(data, "campaign_id");

  if (removeIds.length) {
    const removed = await db("facebook").whereIn("campaign_id", removeIds).andWhere({ date }).del();
    const removed_2 = await db("facebook_partitioned").whereIn("campaign_id", removeIds).andWhere({ date }).del();
    console.info(`DELETED ${removed} rows on date ${date}`);
    console.info(`DELETED ${removed_2} rows on date ${date}`);
  }
  // console.log('data', data)
  data = [...new Map(data.map((item) => [item["campaign_id"] + item["ad_id"] + item["hour"], item])).values()];

  const dataChunks = _.chunk(data, 500);
  for (const chunk of dataChunks) {
    await add("facebook", chunk);
    await add("facebook_partitioned", chunk);
  }

  // await add("facebook", data);
  console.info(`DONE ADDING FACEBOOK DATA 🎉 for ${date}`);
}

async function addFacebookDataByDay(data, date) {
  const removeIds = _.map(data, "campaign_id");

  if (removeIds.length) {
    const removed = await db("facebook_conversion").whereIn("campaign_id", removeIds).andWhere({ date }).del();
    console.info(`DELETED ${removed} rows on date ${date}`);
  }
  data = [...new Map(data.map((item) => [item["campaign_id"], item])).values()];

  const dataChunks = _.chunk(data, 500);
  for (const chunk of dataChunks) {
    await add("facebook_conversion", chunk);
  }

  // await add("facebook_conversion", data);
  console.info(`DONE ADDING FACEBOOK DATA 🎉 for ${date}`);
}

async function getAdCampaigns(access_token, adAccountIds, date = "today") {
  const isPreset = !/\d{4}-\d{2}-\d{2}/.test(date);
  const dateParam = isPreset ? { date_preset: date } : { time_range: { since: date, until: date } };

  const fields =
    "id,account_id,budget_remaining,created_time, daily_budget, status,name,lifetime_budget,start_time,stop_time,updated_time";
  const effective_status = ["ACTIVE", "PAUSED"];

  const allCampaigns = await async.mapLimit(adAccountIds, 100, async (adAccountId) => {
    const url = `${FB_API_URL}${adAccountId}/campaigns`;
    const response = await axios
      .get(url, {
        params: {
          fields,
          ...dateParam,
          access_token,
          effective_status,
        },
      })
      .catch((err) => console.warn(err.response?.data ?? err));
    return response?.data?.data || [];
  });

  return _.flatten(allCampaigns);
}

async function getFacebookPixels(access_token, adAccountIds) {
  const fields = "id,name,account_id,owner_business,is_unavailable,last_fired_time,creation_time,data_use_setting,ad_";
  const allPixels = await async.mapLimit(adAccountIds, 100, async (adAccountId) => {
    const url = `${FB_API_URL}${adAccountId}/adspixels`;
    const response = await axios
      .get(url, {
        params: {
          fields,
          access_token,
          limit: 5000,
        },
      })
      .catch((err) =>
        console.warn("ad_account_id:", adAccountId, "facebook pixels failure", err.response?.data ?? err)
      );

    return response?.data?.data.map((item) => ({ ...item, ad_account_id: adAccountId.replace("act_", "") })) || [];
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
  const dateParam = isPreset ? { date_preset: date } : { time_range: { since: date, until: date } };

  const fields =
    "id,account_id,campaign_id,status,name,daily_budget,lifetime_budget,created_time,start_time,stop_time,budget_remaining,updated_time";

  const allAdsets = await async.mapLimit(adAccountIds, 100, async (adAccountId) => {
    const url = `${FB_API_URL}${adAccountId}/adsets`;
    const response = await axios
      .get(url, {
        params: {
          fields,
          ...dateParam,
          access_token,
          limit: 5000,
        },
      })
      .catch((err) =>
        console.warn(`facebook adsets failure on ad_account_id ${adAccountId}`, err.response?.data ?? err)
      );

    return response?.data?.data || [];
  });

  return _.flatten(allAdsets);
}

function validateInput({ type, token, status }) {
  if (!type || (type !== "adset" && type !== "campaign")) {
    throw Error("Type must be either 'adset' or 'campaign'.");
  }
  if (!token) {
    throw Error("Token is required.");
  }
  if (status && !availableStatuses.includes(status)) {
    throw Error("Status is not valid.");
  }
}

async function updateEntity({ type, token, entityId, dailyBudget, status }) {
  async function updateDatabase(type, entityId, dailyBudget, status) {
    const updateData = {
      ...(status && { status }),
      ...(dailyBudget && { daily_budget: dailyBudget }),
    };

    if (type === "adset") {
      await db("adsets").where("provider_id", entityId).update(updateData);
    } else {
      await db("campaigns").where("id", entityId).update(updateData);
      if (status) {
        await db("adsets").where("campaign_id", entityId).update({ status });
      }
    }
  }

  validateInput({ type, token, status });

  const url = `${FB_API_URL}${entityId}`;
  const params = { access_token: token, ...(status && { status }), ...(dailyBudget && { daily_budget: dailyBudget }) };

  try {
    const response = await axios.post(url, params);
    if (response.data?.success) {
      await updateDatabase(type, entityId, dailyBudget, status);
    }
    return response.data?.success ?? false;
  } catch ({ response }) {
    console.log(response.data);
    return false;
  }
}
async function duplicateCampaign({ deep_copy, status_option, rename_options, entity_id, access_token }) {
  const url = `${FB_API_URL}${entity_id}/copies`;

  const duplicateShallowCampaignOnDb = async (newCampaignId) => {
    // Assuming `db` is your database connection
    const existingCampaign = await db("campaigns").where("id", entity_id).first();
    if (!existingCampaign) {
      throw new Error("Campaign not found");
    }
    let newName = existingCampaign.name;
    if (
      rename_options?.rename_strategy === "DEEP_RENAME" ||
      rename_options?.rename_strategy === "ONLY_TOP_LEVEL_RENAME"
    ) {
      if (rename_options.rename_prefix) {
        newName = `${rename_options.rename_prefix} ${newName}`;
      }
      if (rename_options.rename_suffix) {
        newName = `${newName} ${rename_options.rename_suffix}`;
      }
    }
    // Create a copy of the existing campaign, with some changes
    const newCampaign = {
      ...existingCampaign,
      id: newCampaignId, // Set the new ID
      name: newName,
    };

    // Insert the new campaign into the database
    // const db_response =
    await db("campaigns").insert(newCampaign);
    // console.log(db_response);
    console.log(`succesfully copied campaign on db with id: ${newCampaignId}`);
  };

  const duplicateDeepCopy = async (newCampaignId) => {
    const existingCampaign = await db("campaigns").where("id", newCampaignId).first();
    if (!existingCampaign) {
      throw new Error("Campaign not found");
    }

    // Query the existing adsets with the provided ID
    let existingAdsets;
    try {
      existingAdsets = await db.raw(`
        SELECT
          c.id as campaign_id,
          c.name as campaign_name,
          adsets.provider_id as adset_id,
          adsets.status as adset_status
        FROM adsets
        JOIN campaigns c ON c.id = adsets.campaign_id AND adsets.campaign_id = '${entity_id}';
    `);
      console.log(existingAdsets.rows);
    } catch {
      console.log("ERROR");
    }
    console.log("ASD", existingAdsets);
    // Iterate through the adsets and make necessary changes
    const newAdsets = existingAdsets.rows.map((adset) => {
      console.log(adset);
      duplicateAdset({
        deep_copy: false,
        status_option,
        rename_options: {
          ...rename_options,
          rename_strategy: rename_options?.deep_copy === "DEEP_COPY" ? "DEEP_COPY" : "NONE",
        },
        entity_id: adset.adset_id,
        access_token,
        campaign_id: newCampaignId,
      });
    });
  };

  console.log(url);
  data = {
    deep_copy: false,
    status_option,
    rename_options,
    access_token,
  };

  try {
    const response = await axios.post(url, data);
    console.log(response.data);

    // Normal copy of only the campaign and not of its children
    duplicateShallowCampaignOnDb(response.data?.ad_object_ids?.[0].copied_id);

    //From our side just calling deep_copy is not possible will have to
    //manually get the adsets and call the endpoint for each of them
    if (deep_copy) await duplicateDeepCopy(response.data?.ad_object_ids?.[0].copied_id);
    return { successful: true };
  } catch ({ response }) {
    console.log("here", response);
    return false;
  }
}

async function duplicateAdset({ status_option, rename_options, entity_id, access_token, campaign_id = null }) {
  const url = `${FB_API_URL}${entity_id}/copies`;

  const duplicateShallowAdsetOnDb = async (newAdsetId) => {
    // Assuming `db` is your database connection
    const existingAdset = await db("adsets").where("provider_id", entity_id).first();
    if (!existingAdset) {
      throw new Error("AdSet not found");
    }
    let newName = existingAdset.name;
    if (
      rename_options?.rename_strategy === "DEEP_RENAME" ||
      rename_options?.rename_strategy === "ONLY_TOP_LEVEL_RENAME"
    ) {
      if (rename_options.rename_prefix) {
        newName = `${rename_options.rename_prefix} ${newName}`;
      }
      if (rename_options.rename_suffix) {
        newName = `${newName} ${rename_options.rename_suffix}`;
      }
    }
    // Create a copy of the existing adset, with some changes
    const newAdset = {
      ...existingAdset,
      provider_id: newAdsetId, // Set the new ID
      name: newName,
    };
    delete newAdset.id;
    if (campaign_id) {
      newAdset.campaign_id = campaign_id;
    }

    // Insert the new adset into the database
    await db("adsets").insert(newAdset);
    console.log(`succesfully copied adset on db with id: ${newAdsetId}`);
  };

  console.log(url);
  const data = {
    deep_copy: false,
    status_option,
    rename_options,
    access_token,
  };

  try {
    const response = await axios.post(url, data);
    console.log(response.data);

    duplicateShallowAdsetOnDb(response.data?.ad_object_ids?.[0].copied_id);
    return { successful: true };
  } catch ({ response }) {
    console.log("here", response.data);
    return false;
  }
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
  debugToken,
  updateEntity,
  duplicateCampaign,
  duplicateAdset,
};
