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

module.exports = {
  crossroadsCampaigns,
  crossroadsAdsets}
