const db = require("../../data/dbConfig");

function crossroadsCampaigns(startDate, endDate, traffic_source) {
  return db.raw(`
    SELECT cr.campaign_id as campaign_id,
    MAX(cr.campaign_name) as campaign_name,
    MAX(cr.traffic_source) as traffic_source,
    MAX(cr.cr_camp_name) as cr_camp_name,
    SUM(cr.total_revenue) as revenue,
    CAST(SUM(cr.total_searches) AS INTEGER) as searches,
    CAST(SUM(cr.total_lander_visits) AS INTEGER) as lander_visits,
    CAST(SUM(cr.total_revenue_clicks) AS INTEGER) as revenue_clicks,
    CAST(SUM(cr.total_visitors) AS INTEGER) as visitors,
    CAST(SUM(cr.total_tracked_visitors) AS INTEGER) as tracked_visitors
    FROM crossroads cr
    WHERE cr.date > '${startDate}' AND cr.date <= '${endDate}' AND cr.traffic_source = '${traffic_source}'
    GROUP BY cr.campaign_id
  `)
}

function crossroadsAdsets(startDate, endDate, traffic_source) {
  return db.raw(`
    SELECT cr.adset_id as adset_id,
    MAX(cr.adset_name) as adset_name,
    MAX(cr.traffic_source) as traffic_source,
    MAX(cr.cr_camp_name) as cr_camp_name,
    SUM(cr.total_revenue) as revenue,
    CAST(SUM(cr.total_searches) AS INTEGER) as searches,
    CAST(SUM(cr.total_lander_visits) AS INTEGER) as lander_visits,
    CAST(SUM(cr.total_revenue_clicks) AS INTEGER) as revenue_clicks,
    CAST(SUM(cr.total_visitors) AS INTEGER) as visitors,
    CAST(SUM(cr.total_tracked_visitors) AS INTEGER) as tracked_visitors
    FROM crossroads cr
    WHERE cr.date > '${startDate}' AND cr.date <= '${endDate}' AND cr.traffic_source = '${traffic_source}'
    GROUP BY cr.adset_id
  `)
}

function crossroadsCampaignsForToday(startDate, endDate, traffic_source, hour) {
  return db.raw(`
    SELECT cr.campaign_id as campaign_id,
    MAX(cr.campaign_name) as campaign_name,
    MAX(cr.traffic_source) as traffic_source,
    MAX(cr.cr_camp_name) as cr_camp_name,
    SUM(cr.total_revenue) as revenue,
    CAST(SUM(cr.total_searches) AS INTEGER) as searches,
    CAST(SUM(cr.total_lander_visits) AS INTEGER) as lander_visits,
    CAST(SUM(cr.total_revenue_clicks) AS INTEGER) as revenue_clicks,
    CAST(SUM(cr.total_visitors) AS INTEGER) as visitors,
    CAST(SUM(cr.total_tracked_visitors) AS INTEGER) as tracked_visitors
    FROM crossroads cr
    WHERE cr.date > '${startDate}' AND cr.date <= '${endDate}' AND cr.traffic_source = '${traffic_source}'
    AND cr.hour < '${hour}'
    GROUP BY cr.campaign_id
  `)
}

function crossroadsAdsetsForToday(startDate, endDate, traffic_source, hour) {
  return db.raw(`
    SELECT cr.adset_id as adset_id,
    MAX(cr.adset_name) as adset_name,
    MAX(cr.traffic_source) as traffic_source,
    MAX(cr.cr_camp_name) as cr_camp_name,
    SUM(cr.total_revenue) as revenue,
    CAST(SUM(cr.total_searches) AS INTEGER) as searches,
    CAST(SUM(cr.total_lander_visits) AS INTEGER) as lander_visits,
    CAST(SUM(cr.total_revenue_clicks) AS INTEGER) as revenue_clicks,
    CAST(SUM(cr.total_visitors) AS INTEGER) as visitors,
    CAST(SUM(cr.total_tracked_visitors) AS INTEGER) as tracked_visitors
    FROM crossroads cr
    WHERE cr.date > '${startDate}' AND cr.date <= '${endDate}' AND cr.traffic_source = '${traffic_source}'
    AND cr.hour < '${hour}'
    GROUP BY cr.adset_id
  `)
}

function crossroadsCampaignsByHour(startDate, endDate, traffic_source, groupBy, groupByName, suffix) {
  return db.raw(`
    WITH agg_fb AS (
      SELECT fb.hour,
      fb.${groupBy},
        CAST(ROUND(SUM(fb.total_spent)::decimal, 2) AS FLOAT) as spend
      FROM facebook as fb
      WHERE fb.date > '${startDate}' AND fb.date <= '${endDate}'
      GROUP BY fb.${groupBy}, fb.hour
    ),
    agg_cr AS (
      SELECT cr.hour as hour,
      MAX(cr.${groupBy}) as ${groupBy},
      MAX(cr.${groupByName}) as ${groupByName},
      SUM(cr.total_revenue) as revenue,
      CAST(SUM(cr.total_revenue_clicks) AS INTEGER) as revenue_clicks
      FROM crossroads cr
      WHERE cr.date > '${startDate}' AND cr.date <= '${endDate}' AND cr.traffic_source = '${traffic_source}'
      GROUP BY cr.${groupBy}, cr.hour
    )
    SELECT
    (CASE
      WHEN agg_fb.${groupBy} IS NOT null THEN agg_fb.${groupBy} ELSE CAST(MAX(agg_cr.${groupBy}) AS VARCHAR)
    END) as ${groupBy},
    MAX(agg_cr.${groupByName}) as ${groupByName},
    CAST(MAX(agg_cr.hour) AS VARCHAR) || ':00 - ' || CAST(MAX(agg_cr.hour+1) AS VARCHAR) || ':00' as hour,
    (CASE WHEN SUM(agg_fb.spend) IS null THEN 0 ELSE CAST(SUM(agg_fb.spend) AS FLOAT) END) as total_spent,
    (CASE WHEN SUM(agg_fb.spend) IS null THEN 0 ELSE CAST(SUM(agg_fb.spend) AS FLOAT) END) as spend${suffix},
    (CASE WHEN SUM(agg_cr.revenue) IS null THEN 0 ELSE CAST(ROUND(SUM(agg_cr.revenue)::decimal, 2) AS FLOAT) END) as revenue${suffix},
    (CASE WHEN SUM(agg_cr.revenue_clicks) IS null THEN 0 ELSE CAST(SUM(agg_cr.revenue_clicks) AS INTEGER) END) as revenue_clicks${suffix}
    FROM agg_cr
    LEFT JOIN agg_fb USING (${groupBy}, hour)
    GROUP BY agg_cr.${groupBy}, agg_fb.${groupBy}, agg_cr.hour, agg_fb.hour

  `)
}



function crossroadsAdsetsByHour(startDate, endDate, traffic_source) {
  return db.raw(`
    SELECT DISTINCT ON(cr.hour) hour,
    MAX(cr.adset_id) as adset_id,
    MAX(cr.adset_name) as adset_name,
    MAX(cr.traffic_source) as traffic_source,
    MAX(cr.cr_camp_name) as cr_camp_name,
    SUM(cr.total_revenue) as revenue,
    CAST(SUM(cr.total_searches) AS INTEGER) as searches,
    CAST(SUM(cr.total_lander_visits) AS INTEGER) as lander_visits,
    CAST(SUM(cr.total_revenue_clicks) AS INTEGER) as revenue_clicks,
    CAST(SUM(cr.total_visitors) AS INTEGER) as visitors,
    CAST(SUM(cr.total_tracked_visitors) AS INTEGER) as tracked_visitors
    FROM crossroads cr
    WHERE cr.date > '${startDate}' AND cr.date <= '${endDate}' AND cr.traffic_source = '${traffic_source}'
    AND cr.hour < '${hour}'
    GROUP BY cr.hour
  `)
}

module.exports = {
  crossroadsCampaigns,
  crossroadsCampaignsByHour,
  crossroadsCampaignsForToday,
  crossroadsAdsetsForToday,
  crossroadsAdsets,
  crossroadsAdsetsByHour
}
