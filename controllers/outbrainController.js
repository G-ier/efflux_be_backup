const async = require("async");
const { getUserAccounts } = require("../services/userAccountsService");
const PROVIDERS = require("../constants/providers");
const STATUSES = require("../constants/statuses");
const BUDGET_TYPES = require("../constants/budgetTypes");
const redis = require("../services/redisService");
const { updateAdAccounts } = require("../services/adAccountsService");
const {
  getCampaignsByAdAccount,
  getAdAccounts,
  getSectionsByHour,
  addOutbrainData,
  getSectionsMetadata,
} = require("../services/outbrainService");
const _ = require("lodash");
const { convertDayYMD, convertDayHH } = require("../common/day");
const { updateCampaigns } = require("../services/campaignsService");

async function updateOutbrainData() {
  const accounts = await getUserAccounts(PROVIDERS.OUTBRAIN);

  console.log("accounts length", accounts.length);

  const insights = [];
  for (const account of accounts) {
    const token = await redis.get(`OB_TOKEN_${account.provider_id}`);
    const obAdAccounts = await getAdAccounts(token);
    const processedObAdAccounts = processOutbrainAdAccounts(account, obAdAccounts);
    const adAccounts = await updateAdAccounts(account, processedObAdAccounts);
    const adAccountsMap = _(adAccounts).keyBy("provider_id").value();
    const adAccountsIds = Object.keys(adAccountsMap);
    const adAccountsMirror = _(adAccounts).keyBy("id").mapValues("provider_id").value();

    const adCampaigns = await getCampaignsByAdAccount(token, adAccountsIds);

    const currencyMap = _(adCampaigns).keyBy("id").mapValues(item => item.budget.currency).value();
    const processedCampaigns = processOutbrainCampaigns(account, adCampaigns, adAccountsMap);

    await updateCampaigns(processedCampaigns, PROVIDERS.OUTBRAIN);

    const activeCampaigns = _.filter(processedCampaigns, { status: STATUSES.ACTIVE });
    const rawInsights = await async.mapLimit(activeCampaigns, 25, async (campaign) => {
      const marketer_id = adAccountsMirror[campaign.ad_account_id];
      const hourlySections = await getSectionsByHour(token, marketer_id, { campaignId: campaign.id, hours: 1 });
      if (!hourlySections.length) return [];
      const campaignInsights = processOutbrainHourlySections(campaign, hourlySections, currencyMap);
      console.log(`CAMPAIGN ${campaign.id} - ${campaign.status} - ${campaignInsights.length} results`);
      return campaignInsights;
    });

    const accountInsights = _.flatten(rawInsights);
    const sectionIds = _(accountInsights).map("section_id").uniq().value();
    console.log(`Loading sections metadata for ${sectionIds.length} sections`);
    const sectionsMeta = await getSectionsMetadata(token, sectionIds);
    const sectionsMap = _(sectionsMeta).keyBy("id").mapValues("name").value();
    accountInsights.forEach((insight) => {
      insight.section_name = sectionsMap[insight.section_id] || null;
    });

    insights.push(...accountInsights);

  }
  if(insights.length) {
    const insightsChunks = _.chunk(insights, 500)
    const { timestamp } = _.minBy(insights, "timestamp");
    for(const chunk of insightsChunks) {
      await addOutbrainData(chunk, timestamp);
    }
  }
}

function processOutbrainAdAccounts(account, adAccounts) {
  return adAccounts.map(({ name, id, enabled }) => ({
    name,
    provider: PROVIDERS.OUTBRAIN,
    provider_id: id,
    status: enabled ? STATUSES.ACTIVE : STATUSES.PAUSED,
    user_id: account.user_id,
    account_id: account.id,
  }));
}

function processOutbrainCampaigns(account, campaigns, adAccountsMap) {
  return campaigns.map(item => ({
    name: item.name,
    created_time: item.creationTime,
    updated_time: item.lastModified,
    traffic_source: PROVIDERS.OUTBRAIN,
    id: item.id,
    status: item.enabled ? STATUSES.ACTIVE : STATUSES.PAUSED,
    user_id: account.user_id,
    account_id: account.id,
    ad_account_id: adAccountsMap[item.marketerId].id,
    daily_budget: item.budget.type === BUDGET_TYPES.DAILY ? item.budget.amount : null,
    lifetime_budget: item.budget.type === BUDGET_TYPES.CAMPAIGN ? item.budget.amount : null,
    network: adAccountsMap[item.marketerId].network,
  }));
}

function processOutbrainHourlySections(campaign, rawHourlySections, currencyMap) {
  const processed = _(rawHourlySections)
    .map(({ id: section_id, dataPoints = [] }) => dataPoints.map((item) => ({
      section_id,
      timestamp: item.timestamp,
      campaign_name: campaign.name,
      campaign_id: campaign.id,
      impressions: item?.impressions ?? 0,
      link_clicks: item?.clicks ?? 0,
      total_spent: item?.spend ?? 0,
      conversions: item?.conversions ?? 0,
      reporting_currency: currencyMap[campaign.id],
      date: convertDayYMD(item.timestamp),
      hour: convertDayHH(item.timestamp),
    })))
    .flatten()
    .value();


  return processed;
}

module.exports = {
  updateOutbrainData,
};
