const { buildConditionsInsights, buildSelectionColumns, getDateRanges, castSum } = require("./utils");

async function trafficSourceNetowrkCampaignsAdsetsStats(database, startDate, endDate, network='crossroads', trafficSource, mediaBuyer, ad_accounts, q) {
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
    WHERE date > '${threeDaysAgo}' AND date <= '${endDate}' AND insights.traffic_source = '${trafficSource}' AND insights.network = '${network}'
      ${mediaBuyerCondition}
      ${adAccountCondition}
      ${queryCondition}
    GROUP BY insights.campaign_id, insights.adset_id
  ), yesterday_data AS (
      SELECT
        insights.campaign_id,
        insights.campaign_name,
        CAST(SUM(spend) + SUM(unallocated_spend) AS FLOAT) as yesterday_spend
        FROM insights
      WHERE date > '${yesterdayDate}' AND date <= '${startDate}'
        AND insights.traffic_source = '${trafficSource}' AND insights.network = '${network}'
        ${mediaBuyerCondition}
        ${adAccountCondition}
        GROUP BY insights.campaign_id,insights.campaign_name
    ), last_3_days_data AS (
      SELECT
        insights.campaign_id,
        insights.campaign_name,
        CAST(SUM(spend) + SUM(unallocated_spend) AS FLOAT) as last_3_days_spend
      FROM insights
      WHERE date > '${threeDaysAgo}' AND date <= '${endDate}'
      AND insights.traffic_source = '${trafficSource}' AND insights.network = '${network}'
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

  const { rows } = await database.raw(query);
  return rows;
}

module.exports = trafficSourceNetowrkCampaignsAdsetsStats;
