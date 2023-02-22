const db = require("../../data/dbConfig");

function crossroadsCampaigns(startDate, endDate) {
  return db.raw(`
    SELECT cr.campaign_id as campaign_id,
    MAX(cr.campaign_name) as campaign_name,
    SUM(cr.total_revenue) as revenue,
    CAST(SUM(cr.total_searches) AS INTEGER) as searches,
    CAST(SUM(cr.total_lander_visits) AS INTEGER) as lander_visits,
    CAST(SUM(cr.total_revenue_clicks) AS INTEGER) as revenue_clicks,
    CAST(SUM(cr.total_visitors) AS INTEGER) as visitors,
    CAST(SUM(cr.total_tracked_visitors) AS INTEGER) as tracked_visitors,
    ROUND(
      SUM(cr.total_revenue)::decimal /
      CASE SUM(cr.total_revenue_clicks)::decimal WHEN 0 THEN null ELSE SUM(cr.total_revenue_clicks)::decimal END,
    2) as cr_rpc,
    CEIL(
      SUM(cr.total_revenue)::decimal /
      CASE SUM(cr.total_tracked_visitors)::decimal WHEN 0 THEN null ELSE SUM(cr.total_tracked_visitors)::decimal END * 1000
    ) as cr_rpm
    FROM crossroads cr
    WHERE cr.date > '${startDate}' AND cr.date <= '${endDate}'
    GROUP BY cr.campaign_id
  `)
}

function crossroadsAdsets(startDate, endDate) {
  return db.raw(`
    SELECT cr.adset_id as adset_id,
    MAX(cr.adset_name) as adset_name,
    SUM(cr.total_revenue) as revenue,
    CAST(SUM(cr.total_searches) AS INTEGER) as searches,
    CAST(SUM(cr.total_lander_visits) AS INTEGER) as lander_visits,
    CAST(SUM(cr.total_revenue_clicks) AS INTEGER) as revenue_clicks,
    CAST(SUM(cr.total_visitors) AS INTEGER) as visitors,
    CAST(SUM(cr.total_tracked_visitors) AS INTEGER) as tracked_visitors,
    ROUND(
      SUM(cr.total_revenue)::decimal /
      CASE SUM(cr.total_revenue_clicks)::decimal WHEN 0 THEN null ELSE SUM(cr.total_revenue_clicks)::decimal END,
    2) as cr_rpc,
    CEIL(
      SUM(cr.total_revenue)::decimal /
      CASE SUM(cr.total_tracked_visitors)::decimal WHEN 0 THEN null ELSE SUM(cr.total_tracked_visitors)::decimal END * 1000
    ) as cr_rpm
    FROM crossroads cr
    WHERE cr.date > '${startDate}' AND cr.date <= '${endDate}'
    GROUP BY cr.adset_id
  `)
}

module.exports = {
  crossroadsCampaigns,
  crossroadsAdsets}
