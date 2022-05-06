const db = require('../../data/dbConfig');
const { todayYMD, yesterdayYMD } = require('../day');

const aggregateConversionReport = () => db.raw(`
WITH agg_fb AS (
  SELECT fb.campaign_id,
    MAX(c.name) as campaign_name,
    SUM(fb.total_spent) as total_spent,
    ROUND(
      SUM(total_spent)::decimal / CASE SUM(link_clicks)::decimal WHEN 0 THEN null ELSE SUM(link_clicks)::decimal END,
    2) as cpc,
    SUM(fb.link_clicks) as link_clicks
  FROM facebook as fb
    INNER JOIN campaigns c on fb.campaign_id = c.id and c.traffic_source = 'facebook' and c.network = 'amg'
  WHERE fb.date > '${yesterdayYMD()}' AND fb.date <= '${todayYMD()}'
  GROUP BY fb.campaign_id
),
agg_fbc AS (
  SELECT fbc.campaign_id,
    SUM(fbc.dt_value::decimal) as dt_revenue,
    COUNT(fbc.event_id) as conversions,
    COUNT(distinct fbc.fbclid) as unique_conversions
  FROM fb_conversions as fbc
    INNER JOIN campaigns c on fbc.campaign_id = c.id and c.traffic_source = 'facebook' and c.network = 'amg'
  WHERE fbc.date > '${yesterdayYMD()}' AND fbc.date <= '${todayYMD()}'
  GROUP BY fbc.campaign_id
),
agg_amg AS (
  SELECT amg.campaign_id,
    SUM(amg.revenue) as revenue,
    SUM(amg.clicks) as amg_conversions
  FROM amg
  WHERE amg.date > '${yesterdayYMD()}' AND amg.date <= '${todayYMD()}'
  GROUP BY amg.campaign_id
)
SELECT agg_fb.campaign_id,
  MAX(agg_fb.campaign_name) as campaign_name,
  SUM(agg_fb.total_spent) as total_spent,
  SUM(agg_fb.link_clicks) as link_clicks,
  ROUND(SUM(agg_amg.revenue)::decimal, 2) as revenue,
  SUM(agg_fbc.dt_revenue) as dt_revenue,
  SUM(agg_fbc.conversions) as conversions,
  SUM(agg_fbc.unique_conversions) as unique_conversions,
  SUM(agg_amg.amg_conversions) as amg_conversions,
  ROUND(
    SUM(agg_fb.total_spent)::decimal /
    CASE SUM(agg_fbc.conversions)::decimal WHEN 0 THEN null ELSE SUM(agg_fbc.conversions)::decimal END,
  2) as cpa,
  ROUND(
    SUM(agg_fb.total_spent)::decimal /
    CASE SUM(agg_fb.link_clicks)::decimal WHEN 0 THEN null ELSE SUM(agg_fb.link_clicks)::decimal END,
  2) as cpc,
  ROUND(
    SUM(agg_amg.revenue)::decimal /
    CASE SUM(agg_amg.amg_conversions)::decimal WHEN 0 THEN null ELSE SUM(agg_amg.amg_conversions)::decimal END,
  2) as rpc,
  CEIL(
    SUM(agg_fb.total_spent)::decimal /
    CASE SUM(agg_fb.link_clicks)::decimal WHEN 0 THEN null ELSE SUM(agg_fb.link_clicks)::decimal END * 1000
  ) as cpm
FROM agg_fb
  FULL OUTER JOIN agg_fbc USING (campaign_id)
  FULL OUTER JOIN agg_amg USING (campaign_id)
GROUP BY agg_fb.campaign_id
`);

module.exports = aggregateConversionReport;
