const { buildConditionsInsights, buildSelectionColumns, castSum } = require("./utils");

async function trafficSourceNetowrkCampaignsAdsetsStats(database, startDate, endDate, network='crossroads', trafficSource, mediaBuyer, ad_accounts, q, orgId) {
  const { mediaBuyerCondition, adAccountCondition, queryCondition, orgIdCondition } = buildConditionsInsights(mediaBuyer, ad_accounts, q, orgId);

  const query = `
  WITH adset_data AS (
    SELECT
      insights.campaign_id,
      insights.adset_id,
      MAX(campaign_name) as campaign_name,
      ${trafficSource != 'taboola' ? `
      MAX(adsets.status) as status,
      CAST(COALESCE(MAX(adsets.daily_budget), '0') AS FLOAT) as daily_budget,` :
      `MAX(c.status) as status,
      CAST(COALESCE(MAX(c.daily_budget), '0') AS FLOAT) * 100 as daily_budget,`}
      MAX(insights.adset_name) as adset_name,
      ${castSum(`nw_uniq_conversions`)} as nw_uniq_conversions,
      ${buildSelectionColumns("", calculateSpendRevenue=true)}
    FROM insights
    JOIN ${trafficSource != 'taboola' ? `adsets ON insights.adset_id = adsets.provider_id` : `campaigns c ON c.id = insights.campaign_id`}
    WHERE date > '${startDate}' AND date <= '${endDate}'
      AND insights.traffic_source = '${trafficSource}' AND insights.network = '${network}'
      ${orgIdCondition}
      ${mediaBuyerCondition}
      ${adAccountCondition}
      ${queryCondition}
    GROUP BY insights.campaign_id, insights.adset_id
  )
  SELECT
    ad.campaign_id,
    COALESCE(MAX(ad.campaign_name), MAX(c.name)) as campaign_name,
    MAX(c.status) as status,
    MAX(c.created_at) as created_at,
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
    ${trafficSource === 'taboola' ? 'NULL' : `json_agg(ad.*)` } as adsets
    FROM adset_data ad
    JOIN campaigns c ON ad.campaign_id = c.id
    GROUP BY ad.campaign_id, ad.campaign_name;
  `;
  const { rows } = await database.raw(query);
  return rows;
}

module.exports = trafficSourceNetowrkCampaignsAdsetsStats;
