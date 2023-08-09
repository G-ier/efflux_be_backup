const db              = require('./data/dbConfig');

const trafficSource = 'facebook'
const startDate       = '2023-07-25'
const endDate         = '2023-07-26'
const mediaBuyer      =  null
const adAccountId     =  null
const query           =  null

// DONE
async function dateAggregation(startDate, endDate, trafficSource, mediaBuyer, adAccountId, q) {

  const mediaBuyerCondition = (mediaBuyer !== 'admin' && mediaBuyer)
  ? `AND user_id = ${mediaBuyer}`
  : '';

  const adAccountCondition = adAccountId
  ? `AND ad_account_id = ${adAccountId}`
  : '';

  const queryCondition = q
  ? `AND campaign_name LIKE '%${q}%'`
  : '';

  const query = `
    SELECT
      date,
      CAST(SUM(spend) + SUM(unallocated_spend) AS FLOAT) as spend,
      CAST(SUM(spend_plus_fee)+ SUM(unallocated_spend_plus_fee) AS FLOAT) as spend_plus_fee,
      CAST(SUM(revenue) + SUM(unallocated_revenue) AS FLOAT) as revenue,
      CAST(SUM(searches) AS INTEGER) as searches,
      CAST(SUM(cr_conversions) AS INTEGER) as cr_conversions,
      CAST(SUM(cr_uniq_conversions) AS INTEGER) as uniq_conversions,
      CAST(SUM(visitors) AS INTEGER) as visitors,
      CAST(SUM(tracked_visitors) AS INTEGER) as tracked_visitors,
      CAST(SUM(link_clicks) AS INTEGER) as link_clicks,
      CAST(SUM(impressions) AS INTEGER) as impressions,
      CAST(SUM(pb_conversions) AS INTEGER) as pb_conversions
    FROM insights
    WHERE date > '${startDate}' AND date <= '${endDate}' AND traffic_source = '${trafficSource}'
      ${mediaBuyerCondition}
      ${adAccountCondition}
      ${queryCondition}
    GROUP BY date
    ORDER BY date;
  `
  const data = await db.raw(query)
  console.log(data.rows)
  return data
}
// dateAggregation(startDate, endDate, trafficSource, mediaBuyer, adAccountId, query)

// DONE
async function hourAggregation(startDate, endDate, trafficSource, mediaBuyer, adAccountId, q) {

  const mediaBuyerCondition = (mediaBuyer !== 'admin' && mediaBuyer)
  ? `AND user_id = ${mediaBuyer}`
  : '';

  const adAccountCondition = adAccountId
  ? `AND ad_account_id = ${adAccountId}`
  : '';

  const queryCondition = q
  ? `AND campaign_name LIKE '%${q}%'`
  : '';

  const query = `
    SELECT
      hour,
      CAST(SUM(spend) + SUM(unallocated_spend) AS FLOAT) as spend,
      CAST(SUM(spend_plus_fee)+ SUM(unallocated_spend_plus_fee) AS FLOAT) as spend_plus_fee,
      CAST(SUM(revenue) + SUM(unallocated_revenue) AS FLOAT) as revenue,
      CAST(SUM(searches) AS INTEGER) as searches,
      CAST(SUM(cr_conversions) AS INTEGER) as cr_conversions,
      CAST(SUM(cr_uniq_conversions) AS INTEGER) as uniq_conversions,
      CAST(SUM(visitors) AS INTEGER) as visitors,
      CAST(SUM(tracked_visitors) AS INTEGER) as tracked_visitors,
      CAST(SUM(link_clicks) AS INTEGER) as link_clicks,
      CAST(SUM(impressions) AS INTEGER) as impressions,
      CAST(SUM(pb_conversions) AS INTEGER) as pb_conversions
    FROM insights
    WHERE date > '${startDate}' AND date <= '${endDate}' AND traffic_source = '${trafficSource}'
      ${mediaBuyerCondition}
      ${adAccountCondition}
      ${queryCondition}
    GROUP BY hour
    ORDER BY hour;
  `
  const data = await db.raw(query)
  return data

}
// hourAggregation(startDate, endDate, trafficSource, null, null, null)

// DONE
async function campaignsAggregation(startDate, endDate, trafficSource, mediaBuyer, adAccountId, q) {

  const mediaBuyerCondition = (mediaBuyer !== 'admin' && mediaBuyer)
  ? `AND user_id = ${mediaBuyer}`
  : '';

  const adAccountCondition = adAccountId
  ? `AND ad_account_id = ${adAccountId}`
  : '';

  const queryCondition = q
  ? `AND campaign_name LIKE '%${q}%'`
  : '';

  const query = `
    SELECT
      campaign_id,
      campaign_name,
      CAST(SUM(spend) + SUM(unallocated_spend) AS FLOAT) as spend,
      CAST(SUM(spend_plus_fee)+ SUM(unallocated_spend_plus_fee) AS FLOAT) as spend_plus_fee,
      CAST(SUM(revenue) + SUM(unallocated_revenue) AS FLOAT) as revenue,
      CAST(SUM(searches) AS INTEGER) as searches,
      CAST(SUM(cr_conversions) AS INTEGER) as cr_conversions,
      CAST(SUM(cr_uniq_conversions) AS INTEGER) as uniq_conversions,
      CAST(SUM(visitors) AS INTEGER) as visitors,
      CAST(SUM(tracked_visitors) AS INTEGER) as tracked_visitors,
      CAST(SUM(link_clicks) AS INTEGER) as link_clicks,
      CAST(SUM(impressions) AS INTEGER) as impressions,
      CAST(SUM(pb_conversions) AS INTEGER) as pb_conversions
    FROM insights
    WHERE date > '${startDate}' AND date <= '${endDate}' AND traffic_source = '${trafficSource}'
      ${mediaBuyerCondition}
      ${adAccountCondition}
      ${queryCondition}
    GROUP BY campaign_id, campaign_name
    ORDER BY SUM(revenue) DESC;
  `
  const data = await db.raw(query)
  return data

}

// campaignsAggregation(startDate, endDate, trafficSource, null, null, null)
async function campaignsAggregationWithAdsets(startDate, endDate, trafficSource, mediaBuyer, adAccountId, q) {

  const mediaBuyerCondition = (mediaBuyer !== 'admin' && mediaBuyer)
  ? `AND user_id = ${mediaBuyer}`
  : '';

  const adAccountCondition = adAccountId
  ? `AND ad_account_id = ${adAccountId}`
  : '';

  const queryCondition = q
  ? `AND campaign_name LIKE '%${q}%'`
  : '';

  const query = `
    WITH adset_data AS (
      SELECT
        insights.campaign_id,
        MAX(campaign_name) as campaign_name,
        insights.adset_id,
        MAX(adsets.status) as status,
        CAST(COALESCE(MAX(adsets.daily_budget), '0') AS FLOAT) as daily_budget,
        MAX(insights.adset_name) as adset_name,
        CAST(SUM(spend) + SUM(unallocated_spend) AS FLOAT) as spend,
        CAST(SUM(spend_plus_fee)+ SUM(unallocated_spend_plus_fee) AS FLOAT) as spend_plus_fee,
        CAST(SUM(revenue) + SUM(unallocated_revenue) AS FLOAT) as revenue,
        CAST(SUM(searches) AS INTEGER) as searches,
        CAST(SUM(cr_conversions) AS INTEGER) as cr_conversions,
        CAST(SUM(cr_uniq_conversions) AS INTEGER) as uniq_conversions,
        CAST(SUM(visitors) AS INTEGER) as visitors,
        CAST(SUM(tracked_visitors) AS INTEGER) as tracked_visitors,
        CAST(SUM(link_clicks) AS INTEGER) as link_clicks,
        CAST(SUM(impressions) AS INTEGER) as impressions,
        CAST(SUM(pb_conversions) AS INTEGER) as pb_conversions
      FROM insights
      JOIN adsets ON insights.adset_id = adsets.provider_id
      WHERE date > '${startDate}' AND date <= '${endDate}' AND insights.traffic_source = '${trafficSource}'
        ${mediaBuyerCondition}
        ${adAccountCondition}
        ${queryCondition}
      GROUP BY insights.campaign_id, insights.adset_id
    )
    SELECT
      ad.campaign_id,
      MAX(ad.campaign_name) as campaign_name,
      MAX(c.status) as status,
      SUM(ad.spend) as spend,
      SUM(ad.spend_plus_fee) as spend_plus_fee,
      SUM(ad.revenue) as revenue,
      CAST(SUM(ad.searches) AS INTEGER) as searches,
      CAST(SUM(ad.cr_conversions) AS INTEGER) as cr_conversions,
      CAST(SUM(ad.uniq_conversions) AS INTEGER) as uniq_conversions,
      CAST(SUM(ad.visitors) AS INTEGER) as visitors,
      CAST(SUM(ad.tracked_visitors) AS INTEGER) as tracked_visitors,
      CAST(SUM(ad.link_clicks) AS INTEGER) as link_clicks,
      CAST(SUM(ad.impressions) AS INTEGER) as impressions,
      CAST(SUM(ad.pb_conversions) AS INTEGER) as pb_conversions,
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
    JOIN campaigns c ON ad.campaign_id = c.id
    GROUP BY ad.campaign_id, ad.campaign_name
  `
  const data = await db.raw(query)
  return data
}

// campaignsAggregationWithAdsets(startDate, endDate, trafficSource, null, null, null).then(data => console.log(data.rows))

const campaignId = '23855155642170044'
async function campaignsAggregationByAdset(startDate, endDate, campaignId) {

  const query = `
    SELECT
      adset_id,
      adset_name,
      CAST(SUM(spend) + SUM(unallocated_spend) AS FLOAT) as spend,
      CAST(SUM(spend_plus_fee)+ SUM(unallocated_spend_plus_fee) AS FLOAT) as spend_plus_fee,
      CAST(SUM(revenue) + SUM(unallocated_revenue) AS FLOAT) as revenue,
      CAST(SUM(searches) AS INTEGER) as searches,
      CAST(SUM(cr_conversions) AS INTEGER) as cr_conversions,
      CAST(SUM(cr_uniq_conversions) AS INTEGER) as uniq_conversions,
      CAST(SUM(visitors) AS INTEGER) as visitors,
      CAST(SUM(tracked_visitors) AS INTEGER) as tracked_visitors,
      CAST(SUM(link_clicks) AS INTEGER) as link_clicks,
      CAST(SUM(impressions) AS INTEGER) as impressions,
      CAST(SUM(pb_conversions) AS INTEGER) as pb_conversions
    FROM insights
    WHERE date > '${startDate}' AND date <= '${endDate}'
    AND campaign_id = '${campaignId}'
    GROUP BY adset_id, adset_name
    ORDER BY SUM(revenue) DESC;
  `
  const data = await db.raw(query)
  return data
}
// campaignsAggregationByAdset(campaignId)

async function campaignsAggregationByDate(startDate, endDate, campaignId) {

  const query = `
    SELECT
      date,
      CAST(SUM(spend) + SUM(unallocated_spend) AS FLOAT) as spend,
      CAST(SUM(spend_plus_fee)+ SUM(unallocated_spend_plus_fee) AS FLOAT) as spend_plus_fee,
      CAST(SUM(revenue) + SUM(unallocated_revenue) AS FLOAT) as revenue,
      CAST(SUM(searches) AS INTEGER) as searches,
      CAST(SUM(cr_conversions) AS INTEGER) as cr_conversions,
      CAST(SUM(cr_uniq_conversions) AS INTEGER) as uniq_conversions,
      CAST(SUM(visitors) AS INTEGER) as visitors,
      CAST(SUM(tracked_visitors) AS INTEGER) as tracked_visitors,
      CAST(SUM(link_clicks) AS INTEGER) as link_clicks,
      CAST(SUM(impressions) AS INTEGER) as impressions,
      CAST(SUM(pb_conversions) AS INTEGER) as pb_conversions
    FROM insights
    WHERE date > '${startDate}' AND date <= '${endDate}'
    AND campaign_id = '${campaignId}'
    GROUP BY date
    ORDER BY SUM(revenue) DESC;
  `
  const data = await db.raw(query)
  return data
}
// campaignsAggregationByDate(campaignId)

async function campaignsAggregationByHour(startDate, endDate, campaignId) {

  const query = `
    SELECT
      hour,
      CAST(SUM(spend) + SUM(unallocated_spend) AS FLOAT) as spend,
      CAST(SUM(spend_plus_fee)+ SUM(unallocated_spend_plus_fee) AS FLOAT) as spend_plus_fee,
      CAST(SUM(revenue) + SUM(unallocated_revenue) AS FLOAT) as revenue,
      CAST(SUM(searches) AS INTEGER) as searches,
      CAST(SUM(cr_conversions) AS INTEGER) as cr_conversions,
      CAST(SUM(cr_uniq_conversions) AS INTEGER) as uniq_conversions,
      CAST(SUM(visitors) AS INTEGER) as visitors,
      CAST(SUM(tracked_visitors) AS INTEGER) as tracked_visitors,
      CAST(SUM(link_clicks) AS INTEGER) as link_clicks,
      CAST(SUM(impressions) AS INTEGER) as impressions,
      CAST(SUM(pb_conversions) AS INTEGER) as pb_conversions
    FROM insights
    WHERE date > '${startDate}' AND date <= '${endDate}'
    AND campaign_id = '${campaignId}'
    GROUP BY hour
    ORDER BY hour;
  `
  const data = await db.raw(query)
  return data
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
