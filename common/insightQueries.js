const db = require("../data/dbConfig");
const {
  yesterdayRange,
  threeDaysAgoRange,
  threeDaysAgoYMD,
  yesterdayYMD,
  dayBeforeYesterdayYMD,
} = require("./day");
const trafficSource = "facebook";
const startDate = "2023-07-25";
const endDate = "2023-07-26";
const mediaBuyer = null;
const adAccountId = null;
const query = null;

function castSum(column, type = "INTEGER") {
  return `CAST(SUM(${column}) AS ${type})`;
}

function buildSelectionColumns(prefix = "", calculateSpendRevenue = false) {
  return `
  ${
    calculateSpendRevenue ? `
      ${castSum("spend", type = "FLOAT")} + ${castSum("unallocated_spend", type = "FLOAT")} as spend,
      ${castSum("spend_plus_fee", type = "FLOAT")} + ${castSum("unallocated_spend_plus_fee", type = "FLOAT")} as spend_plus_fee,
      ${castSum("revenue", type = "FLOAT")} + ${castSum("unallocated_revenue", type = "FLOAT")} as revenue,
    ` : ``
  }
  ${castSum(`${prefix}searches`)} as searches,
  ${castSum(`${prefix}cr_conversions`)} as cr_conversions,
  ${castSum(`${prefix}visitors`)} as visitors,
  ${castSum(`${prefix}tracked_visitors`)} as tracked_visitors,
  ${castSum(`${prefix}link_clicks`)} as link_clicks,
  ${castSum(`${prefix}impressions`)} as impressions,
  ${castSum(`${prefix}pb_conversions`)} as pb_conversions,
  ${castSum(`${prefix}cr_uniq_conversions`)} as uniq_conversions,
  0 as cost_per_purchase,
  0 as cost_per_lead,
  0 as cost_per_complete_payment,
  0 as traffic_source_cost_per_result
  `;
}

function buildConditionsInsights(mediaBuyer, adAccountIds, q) {
  let adAccountCondition;

  if (Array.isArray(adAccountIds)) {
    adAccountCondition = `AND insights.ad_account_id IN (${adAccountIds.join(",")})`;
  } else if (adAccountIds) {
    adAccountCondition = `AND insights.ad_account_id = ${adAccountIds}`
  } else {
    adAccountCondition = "";
  }

  return {
    mediaBuyerCondition: mediaBuyer !== "admin" && mediaBuyer ? `AND insights.user_id = ${mediaBuyer}` : "",
    adAccountCondition: adAccountCondition,
    queryCondition: q ? `AND insights.campaign_name LIKE '%${q}%'` : "",
  };
}

// DONE
async function dateAggregation(startDate, endDate, trafficSource, mediaBuyer, adAccountId, q) {

  const { mediaBuyerCondition, adAccountCondition, queryCondition } = buildConditionsInsights(mediaBuyer, adAccountId, q);

  const query = `
    SELECT
      date,
      ${buildSelectionColumns(prefix="", calculateSpendRevenue=true)}
    FROM insights
    WHERE date > '${startDate}' AND date <= '${endDate}' AND traffic_source = '${trafficSource}'
      ${mediaBuyerCondition}
      ${adAccountCondition}
      ${queryCondition}
    GROUP BY date
    ORDER BY date;
  `;
  const data = await db.raw(query);
  return data;
}
// dateAggregation(startDate, endDate, trafficSource, mediaBuyer, adAccountId, query)

// DONE
async function hourAggregation(startDate, endDate, trafficSource, mediaBuyer, adAccountIds, q) {

  const { mediaBuyerCondition, adAccountCondition, queryCondition } = buildConditionsInsights(mediaBuyer, adAccountIds, q);

  const query = `
    SELECT
      hour,
      ${buildSelectionColumns(prefix="", calculateSpendRevenue=true)}
    FROM insights
    WHERE date > '${startDate}' AND date <= '${endDate}' AND traffic_source = '${trafficSource}'
      ${mediaBuyerCondition}
      ${adAccountCondition}
      ${queryCondition}
    GROUP BY hour
    ORDER BY hour;
  `;
  const data = await db.raw(query);
  return data;
}
// hourAggregation(startDate, endDate, trafficSource, null, null, null)

// DONE
async function campaignsAggregation(startDate, endDate, trafficSource, mediaBuyer, adAccountId, q) {

  const { mediaBuyerCondition, adAccountCondition, queryCondition } = buildConditionsInsights(mediaBuyer, adAccountId, q);

  const query = `
    SELECT
      campaign_id,
      campaign_name,
      ${buildSelectionColumns(prefix="", calculateSpendRevenue=true)}
    FROM insights
    WHERE date > '${startDate}' AND date <= '${endDate}' AND traffic_source = '${trafficSource}'
      ${mediaBuyerCondition}
      ${adAccountCondition}
      ${queryCondition}
    GROUP BY campaign_id, campaign_name
    ORDER BY SUM(revenue) DESC;
  `;
  const data = await db.raw(query);
  return data;
}
// campaignsAggregation(startDate, endDate, trafficSource, null, null, null)

function getDateRanges(startDate) {
  const yesterdayDate = yesterdayYMD(startDate);
  const threeDaysAgo = dayBeforeYesterdayYMD(startDate);
  return { yesterdayDate, threeDaysAgo };
}

async function campaignsAggregationWithAdsets(startDate, endDate, trafficSource, mediaBuyer, ad_accounts, q) {
  const { mediaBuyerCondition, adAccountCondition, queryCondition } = buildConditionsInsights(mediaBuyer, ad_accounts, q);
  const { yesterdayDate, threeDaysAgo } = getDateRanges(startDate);

  const query = `
  WITH adset_data AS (
    SELECT
      insights.campaign_id,
      insights.adset_id,
      MAX(campaign_name) as campaign_name,
      MAX(adsets.status) as status,
      CAST(COALESCE(MAX(adsets.daily_budget), '0') AS FLOAT) as daily_budget,
      MAX(insights.adset_name) as adset_name,
      CAST(SUM(CASE WHEN date > '${startDate}' AND date <= '${endDate}' THEN spend + unallocated_spend ELSE 0 END) AS FLOAT) as spend,
      CAST(SUM(CASE WHEN date > '${startDate}' AND date <= '${endDate}' THEN spend_plus_fee + unallocated_spend_plus_fee ELSE 0 END) AS FLOAT) as spend_plus_fee,
      CAST(SUM(CASE WHEN date > '${startDate}' AND date <= '${endDate}' THEN revenue + unallocated_revenue ELSE 0 END) AS FLOAT) as revenue,
      CAST(SUM(CASE WHEN date > '${yesterdayDate}' AND date <= '${startDate}' THEN spend + unallocated_spend ELSE 0 END) AS FLOAT) as yesterday_spend,
      CAST(SUM(CASE WHEN date > '${threeDaysAgo}' AND date <= '${endDate}' THEN spend + unallocated_spend ELSE 0 END) AS FLOAT) as last_3_days_spend,
      ${castSum(`cr_uniq_conversions`)} as cr_uniq_conversions,
      ${buildSelectionColumns()}
    FROM insights
    JOIN adsets ON insights.adset_id = adsets.provider_id
    WHERE date > '${threeDaysAgo}' AND date <= '${endDate}' AND insights.traffic_source = '${trafficSource}'
      ${mediaBuyerCondition}
      ${adAccountCondition}
      ${queryCondition}
    GROUP BY insights.campaign_id, insights.adset_id
  ),
    yesterday_data AS (
      SELECT
        insights.campaign_id,
        insights.campaign_name,
        CAST(SUM(spend) + SUM(unallocated_spend) AS FLOAT) as yesterday_spend
        FROM insights
      WHERE date > '${yesterdayDate}' AND date <= '${startDate}'
        AND insights.traffic_source = '${trafficSource}'
        ${mediaBuyerCondition}
        ${adAccountCondition}
        GROUP BY insights.campaign_id,insights.campaign_name
    ),
    last_3_days_data AS (
      SELECT
        insights.campaign_id,
        insights.campaign_name,
        CAST(SUM(spend) + SUM(unallocated_spend) AS FLOAT) as last_3_days_spend
      FROM insights
      WHERE date > '${threeDaysAgo}' AND date <= '${endDate}'
      ${mediaBuyerCondition}
      ${adAccountCondition}
      GROUP BY insights.campaign_id,insights.campaign_name
    )
SELECT
  ad.campaign_id,
  MAX(ad.campaign_name) as campaign_name,
  MAX(c.status) as status,
  MAX(yd.yesterday_spend) as yesterday_spend,
  MAX(l3d.last_3_days_spend) as last_3_days_spend,
  ${castSum("ad.spend", "FLOAT")} as spend,
  ${castSum("ad.spend_plus_fee", "FLOAT")} as spend_plus_fee,
  ${castSum("ad.revenue", "FLOAT")} as revenue,
  ${buildSelectionColumns("ad.", calculateSpendRevenue=false)},
  CASE
    WHEN SUM(ad.daily_budget) > 0 THEN 'adset'
    ELSE 'campaign'
  END AS budget_level,
  CASE
    WHEN SUM(ad.daily_budget) > 0 THEN SUM(
     CASE WHEN ad.status = 'ACTIVE' THEN ad.daily_budget ELSE 0 END
    )
    ELSE CAST(MAX(c.daily_budget) AS FLOAT)
  END AS daily_budget,
  json_agg(ad.*) as adsets
  FROM adset_data ad
  LEFT JOIN yesterday_data yd ON ad.campaign_id = yd.campaign_id
  LEFT JOIN last_3_days_data l3d ON ad.campaign_id = l3d.campaign_id
  JOIN campaigns c ON ad.campaign_id = c.id
  GROUP BY ad.campaign_id, ad.campaign_name;
  `;

  const data = await db.raw(query);
  return data;
}
// campaignsAggregationWithAdsets(startDate, endDate, trafficSource, mediaBuyer, adAccountId, query)

const campaignId = "23855155642170044";
async function campaignsAggregationByAdset(startDate, endDate, campaignId) {
  const query = `
    SELECT
      adset_id,
      adset_name,
      ${buildSelectionColumns(prefix="", calculateSpendRevenue=true)}
    FROM insights
    WHERE date > '${startDate}' AND date <= '${endDate}'
    AND campaign_id = '${campaignId}'
    GROUP BY adset_id, adset_name
    ORDER BY SUM(revenue) DESC;
  `;
  const data = await db.raw(query);
  return data;
}
// campaignsAggregationByAdset(campaignId)

async function campaignsAggregationByDate(startDate, endDate, campaignId) {
  const query = `
    SELECT
      date,
      ${buildSelectionColumns(prefix="", calculateSpendRevenue=true)}
    FROM insights
    WHERE date > '${startDate}' AND date <= '${endDate}'
    AND campaign_id = '${campaignId}'
    GROUP BY date
    ORDER BY SUM(revenue) DESC;
  `;
  const data = await db.raw(query);
  return data;
}
// campaignsAggregationByDate(campaignId)

async function campaignsAggregationByHour(startDate, endDate, campaignId) {
  const query = `
    SELECT
      hour,
      ${buildSelectionColumns(prefix="", calculateSpendRevenue=true)}
    FROM insights
    WHERE date > '${startDate}' AND date <= '${endDate}'
    AND campaign_id = '${campaignId}'
    GROUP BY hour
    ORDER BY hour;
  `;
  const data = await db.raw(query);
  return data;
}
// campaignsAggregationByHour(campaignId)

module.exports = {
  dateAggregation,
  hourAggregation,
  campaignsAggregation,
  campaignsAggregationWithAdsets,
  campaignsAggregationByAdset,
  campaignsAggregationByDate,
  campaignsAggregationByHour,
}
