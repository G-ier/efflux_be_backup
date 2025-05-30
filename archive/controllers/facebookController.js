const _ = require("lodash");
const { getUserAccounts } = require("../services/userAccountsService");
const PROVIDERS = require("../constants/providers");
const NETWORKS = require("../constants/networks");
const {
  updateAdAccounts,
  getAccountAdAccounts,
  updateUserAdAccountsTodaySpent,
} = require("../services/adAccountsService");
const { updateCampaigns, upsertCampaigns } = require("../services/campaignsService");
const { updateAdsets } = require("../services/adsetsService");
const {
  getAdAccounts,
  getAdInsights,
  getAdInsightsByDay,
  getAdCampaigns,
  addFacebookData,
  addFacebookDataByDay,
  getAdsets,
  getFacebookPixels,
  getAdAccountsTodaySpent,
  debugToken,
  updateEntity,
  duplicateCampaign,
  duplicateAdset,
} = require("../services/facebookService");
const { updatePixels } = require("../services/pixelsService.js");
const { sendSlackNotification } = require("../services/slackNotificationService");

async function updateFacebookData(date) {
  try {
    console.log("START UPDATING FACEBOOK DATA");

    //1 Get user accounts related to facebook.
    const accounts = await getUserAccounts(PROVIDERS.FACEBOOK);

    let accountValidity = {};

    // 2 Check if the accounts are valid
    for (const account of accounts) {
      let [username, isValid] = await debugToken(account.token, account.token);
      accountValidity[account.id] = isValid;
    }

    // 3 If no accounts are valid, return
    if (Object.values(accountValidity).every((val) => val !== true)) {
      await sendSlackNotification(`Facebook Insight Fetching: All accounts are invalid`);
      return;
    }

    // 4 Get the acount that will do the fetching
    const account = accounts.filter((account) => accountValidity[account.id] === true)[0];

    console.log("Fetching with account", account);

    // Get ad accounts from facebook linked to user account
    const fbAdAccounts = await getAdAccounts(account.provider_id, account.token);

    // Update ad_accounts table in database
    const processedAdAccounts = processFacebookAdAccounts(account, fbAdAccounts);
    const adAccounts = await updateAdAccounts(account, processedAdAccounts);

    const adAccountsMap = _(adAccounts).keyBy("provider_id").value();
    const adAccountsIds = Object.keys(adAccountsMap).map((provider_id) => `act_${provider_id}`);

    // Retrieve facebook pixels related to ad account ids from facebook
    let pixels = await getFacebookPixels(account.token, adAccountsIds);
    pixels = _.uniqBy(pixels, "id");
    // Update pixels table in database
    const processedPixels = await processFacebookPixels(pixels, adAccountsMap, account.id);
    const pixelIds = processedPixels.map((item) => item.pixel_id);
    await updatePixels(processedPixels, pixelIds);

    // Retrieve facebook campaigns related to ad account ids from facebook
    const adCampaigns = await getAdCampaigns(account.token, adAccountsIds, date);
    console.log("CAMPAIGNS length", adCampaigns.length);
    // Update campaigns table in database
    const processedAdCampaigns = processFacebookCampaigns(account.id, adCampaigns, adAccountsMap);
    const campaignChunks = _.chunk(processedAdCampaigns, 100);
    for (const chunk of campaignChunks) {
      await upsertCampaigns(chunk, "id");
    }

    // Retrieve facebook adsets related to ad account ids from facebook
    const adsets = await getAdsets(account.token, adAccountsIds, date);
    console.log("ADSETS length", adsets.length);
    // Update adsets table in database
    const processedAdsets = processFacebookAdsets(account.id, adsets, adAccountsMap);
    const adsetsChunks = _.chunk(processedAdsets, 100);
    for (const chunk of adsetsChunks) {
      await updateAdsets(chunk, PROVIDERS.FACEBOOK);
    }

    console.log("FINISH UPDATING FACEBOOK DATA");
  } catch (e) {
    await sendSlackNotification(`Facebook Data Update\nError: \n${e.toString()}`);
    console.log(e);
  }
}

async function updateFacebookInsights(date) {
  try {
    console.log("START UPDATING FACEBOOK INSIGHTS");

    //1 Get user accounts related to facebook.
    const accounts = await getUserAccounts(PROVIDERS.FACEBOOK);

    let accountValidity = {};

    // 2 Check if the accounts are valid
    for (const account of accounts) {
      let [username, isValid] = await debugToken(account.token, account.token);
      accountValidity[account.id] = isValid;
    }

    // 3 If no accounts are valid, return
    if (Object.values(accountValidity).every((val) => val !== true)) {
      await sendSlackNotification(`Facebook Insight Fetching: All accounts are invalid`);
      return;
    }

    // 4 Get the acount that will do the fetching
    const account = accounts.filter((account) => accountValidity[account.id] === true)[0];

    const facebookInsights = [];
    const facebookInsightsByDay = [];
    const adAccountsIdsMap = {};

    console.log("User Account", account);

    //2 Get ad accounts  based user account id
    const adAccounts = await getAccountAdAccounts(account.id);

    // Create a dict of provider_id: id from ad accounts
    adAccounts.forEach((item) => {
      adAccountsIdsMap[item.provider_id] = item.id;
    });
    // provider_id: ad_account value from db
    const adAccountsMap = _(adAccounts).keyBy("provider_id").value();
    // a list of act_{provider_id} strings
    const adAccountsIds = Object.keys(adAccountsMap).map((provider_id) => `act_${provider_id}`);

    // Retrieve data for all the ad accounts from facebook api
    const accountInsights = await getAdInsights(account.token, adAccountsIds, date);
    facebookInsights.push(...accountInsights);

    // get facebook_conversion data
    const accountInsightsByDay = await getAdInsightsByDay(account.token, adAccountsIds, date);
    facebookInsightsByDay.push(...accountInsightsByDay);

    // Processing the insight for the database.
    const processedInsights = processFacebookInsights(facebookInsights, date);
    await addFacebookData(processedInsights, date);

    // add facebook_conversion data
    const processedInsightsByDay = processFacebookInsightsByDay(facebookInsightsByDay, date);
    await addFacebookDataByDay(processedInsightsByDay, date);
    console.log("FINISH UPDATING FACEBOOK INSIGHTS");
  } catch (e) {
    await sendSlackNotification(`Facebook Insight Fetching\nError: \n${e.toString()}`);
    console.log(e);
  }
}
// DEAD FUNCTIONS
async function updateFacebookAdAccountsTodaySpent(date) {
  try {
    console.log("START UPDATING FACEBOOK AD ACCOUNTS TODAY SPENT");
    const accounts = await getUserAccounts(PROVIDERS.FACEBOOK);

    const adAccountsIdsMap = {};
    for (const account of accounts) {
      const adAccounts = await getAccountAdAccounts(account.id);
      adAccounts.forEach((item) => {
        adAccountsIdsMap[item.provider_id] = item.id;
      });
      const adAccountsMap = _(adAccounts).keyBy("provider_id").value();
      const adAccountsIds = Object.keys(adAccountsMap).map((provider_id) => `act_${provider_id}`);

      const AdAccountsData = await getAdAccountsTodaySpent(account.token, adAccountsIds, date);

      await updateUserAdAccountsTodaySpent(AdAccountsData);
    }

    console.log("FINISH UPDATING FACEBOOK AD ACCOUNTS TODAY SPENT");
  } catch (e) {
    console.log("UPDATING FACEBOOK AD ACCOUNTS TODAY SPENT ERROR");
    console.log(e);
  }
}

function processFacebookInsights(data, date) {
  return data
    .filter((item) => item.hourly_stats_aggregated_by_advertiser_time_zone)
    .map((item) => {
      const hour = item.hourly_stats_aggregated_by_advertiser_time_zone.slice(0, 2);

      const conversions = item?.actions?.find((i) => i.action_type === "offsite_conversion.fb_pixel_purchase")?.value;
      // _.sumBy(item.conversions, ({value}) => _.isNaN(Number(value)) ? 0 : Number(value))
      const lead = item?.actions?.find((i) => i.action_type === "offsite_conversion.fb_pixel_lead")?.value;
      return {
        ad_account_id: item.account_id,
        ad_id: item.ad_id,
        adset_id: item.adset_id,
        campaign_id: item.campaign_id,
        campaign_name: item.campaign_name,
        date: date,
        hour: +(hour.startsWith("0") ? hour.replace("0", "") : hour),
        impressions: item?.impressions ?? 0,
        link_clicks: item?.inline_link_clicks ?? 0,
        total_spent: item?.spend ?? 0,
        cpc: item?.cpc ?? 0,
        reporting_currency: item.account_currency,
        conversions: _.isNaN(Number(conversions)) ? 0 : Number(conversions),
        clicks: _.isNaN(Number(item?.clicks)) ? 0 : Number(item?.clicks),
        events: JSON.stringify(item.actions),
        lead: _.isNaN(Number(lead)) ? 0 : Number(lead),
      };
    });
}

function processFacebookInsightsByDay(data, date) {
  return data
    .filter((item) => item.cost_per_action_type)
    .map((item) => {
      const cost_per_conversion = item?.cost_per_action_type?.find((i) => i.action_type === "purchase")?.value;
      return {
        ad_id: item.ad_id,
        adset_id: item.adset_id,
        campaign_id: item.campaign_id,
        date: date,
        cost_per_conversion,
      };
    });
}

function processFacebookPixels(pixels, adAccountsMap, accountId) {
  return pixels.map((pixel) => ({
    pixel_id: pixel.id,
    user_id: adAccountsMap[pixel.ad_account_id].user_id,
    account_id: accountId,
    name: pixel.name,
    business_id: pixel?.owner_business.id || null,
    business_name: pixel?.owner_business.name || null,
    is_unavailable: pixel.is_unavailable,
    last_fired_time: pixel.last_fired_time,
    creation_time: pixel.creation_time,
    data_use_setting: pixel.data_use_setting,
  }));
}

function processFacebookAdAccounts(account, adAccounts) {
  return adAccounts.map(
    ({
      name,
      id,
      amount_spent,
      balance,
      spend_cap,
      currency,
      timezone_name,
      timezone_offset_hours_utc,
      account_id,
    }) => ({
      name,
      provider: PROVIDERS.FACEBOOK,
      provider_id: id.replace(/^act_/, ""),
      status: "active", // not supported yet
      user_id: account.user_id,
      account_id: account.id,
      fb_account_id: account_id,
      amount_spent,
      balance,
      spend_cap,
      currency,
      tz_name: timezone_name,
      tz_offset: timezone_offset_hours_utc,
    })
  );
}

async function pickFetchingAccount() {
  const accounts = await getUserAccounts("facebook");

  let accountValidity = {};

  // 2 Check if the accounts are valid
  for (const account of accounts) {
    let [username, isValid] = await debugToken(account.token, account.token);

    accountValidity[account.id] = isValid;
  }

  // 3 If no accounts are valid, return
  if (Object.values(accountValidity).every((val) => val !== true)) {
    console.log(`Facebook Insight Fetching: All accounts are invalid`);
    return;
  }

  // 4 Get the acount that will do the fetching
  const account = accounts.filter((account) => accountValidity[account.id] === true)[0];

  return account;
}

async function updateEntityController({ type, entityId, dailyBudget, status }) {
  const fetchedAccounts = await pickFetchingAccount();
  const token = fetchedAccounts.token;
  const pausedStatus = await updateEntity({
    token,
    entityId,
    type,
    status,
    dailyBudget,
  });
  return pausedStatus;
}

async function duplicateEntityController({ type, deep_copy, status_option, rename_options, entity_id }) {
  const fetchedAccounts = await pickFetchingAccount();
  const token = fetchedAccounts.token;
  if (type === "campaign") {
    const duplicated = await duplicateCampaign({
      deep_copy,
      status_option,
      rename_options,
      entity_id,
      access_token: token,
    });
    return duplicated;
  }
  if (type === "adset") {
    const duplicated = await duplicateAdset({
      deep_copy,
      status_option,
      rename_options,
      entity_id,
      access_token: token,
      campaign_id: null,
    });
    return duplicated;
  }
}

function processFacebookCampaigns(accountId, campaigns, adAccountsMap) {
  return campaigns.map((item) => ({
    name: item.name,
    created_time: item.created_time,
    updated_time: item.updated_time,
    traffic_source: PROVIDERS.FACEBOOK,
    id: item.id,
    status: item.status,
    user_id: adAccountsMap[item.account_id].user_id,
    account_id: accountId,
    ad_account_id: adAccountsMap[item.account_id].id,
    daily_budget: item?.daily_budget ?? null,
    lifetime_budget: item?.lifetime_budget ?? null,
    budget_remaining: item?.budget_remaining ?? null,
    network: adAccountsMap[item.account_id].network,
  }));
}

function processFacebookAdsets(accountId, adsets, adAccountsMap) {
  return adsets.map((item) => ({
    name: item.name,
    created_time: item.created_time,
    updated_time: item.updated_time,
    traffic_source: PROVIDERS.FACEBOOK,
    provider_id: item.id,
    status: item.status,
    campaign_id: item.campaign_id,
    user_id: adAccountsMap[item.account_id].user_id,
    account_id: accountId,
    ad_account_id: adAccountsMap[item.account_id].id,
    daily_budget: item?.daily_budget ?? null,
    lifetime_budget: item?.lifetime_budget ?? null,
    budget_remaining: item?.budget_remaining ?? null,
    network: adAccountsMap[item.account_id]?.network ?? NETWORKS.UNKNOWN,
  }));
}

module.exports = {
  updateFacebookData,
  updateFacebookInsights,
  updateFacebookAdAccountsTodaySpent,
  processFacebookInsights,
  updateEntityController,
  duplicateEntityController,
};
