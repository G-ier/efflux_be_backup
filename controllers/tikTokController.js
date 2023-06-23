
const _                                       = require("lodash");
const PROVIDERS                               = require("../constants/providers");
const {
  getTikTokAdAccounts,
  getTikTokCampaigns,
  getTikTokAdGroups,
  getTikTokAds,
  getTikTokAdInsights,
  updateAdInsights
}                                             = require("../services/tikTokService");
const { getUserAccounts }                     = require("../services/userAccountsService");
const { updateAdAccounts }                    = require("../services/adAccountsService");
const { updateCampaigns }                     = require("../services/campaignsService");
const { updateAdsets }                        = require("../services/adsetsService");
const { updateTikTokAds }                     = require("../services/adsService");
const { getAccountAdAccounts }                = require("../services/adAccountsService");
const { getCampaignData }                     = require("../services/campaignsService");


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

const processTikTokAdGroups = (account, adAccountsMap, adGroupsData, date) => {
  return adGroupsData.map(({campaign_id, adgroup_name, adgroup_id, create_time, modify_time, operation_status, advertiser_id, budget}) => ({
    name: adgroup_name,
    created_time: create_time,
    updated_time: modify_time,
    traffic_source: PROVIDERS.TIKTOK,
    campaign_id: campaign_id,
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

module.exports = {
  updateTikTokData,
  updateTikTokInsights
};
