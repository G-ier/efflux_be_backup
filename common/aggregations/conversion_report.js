const db = require('../../data/dbConfig');
const { todayYMD, yesterdayYMD } = require('../day');

const aggregateConversionReport = () => db.raw(`
WITH agg_fb AS (
  SELECT fb.campaign_id,
    MAX(fb.campaign_name) as campaign_name,
    SUM(fb.total_spent) as total_spent,
    ROUND(
      SUM(total_spent)::decimal / CASE SUM(link_clicks)::decimal WHEN 0 THEN null ELSE SUM(link_clicks)::decimal END,
    2) as cpc,
    SUM(fb.link_clicks) as link_clicks
  FROM facebook as fb
  WHERE fb.date > '${yesterdayYMD()}' AND fb.date <= '${todayYMD()}'
  GROUP BY fb.campaign_id
),
agg_fbc AS (
  SELECT fbc.campaign_id,
    SUM(fbc.dt_value::decimal) as dt_revenue,
    COUNT(fbc.event_id) as conversions,
    COUNT(distinct fbc.fbclid) as unique_conversions
  FROM fb_conversions as fbc
  WHERE fbc.date > '${yesterdayYMD()}' AND fbc.date <= '${todayYMD()}'
  GROUP BY fbc.campaign_id
),
agg_cr AS (
  SELECT cr.campaign_id,
    SUM(cr.total_revenue) as revenue,
    SUM(cr.total_tracked_visitors) as visitors,
    SUM(cr.total_revenue_clicks) as cr_conversions
  FROM crossroads as cr
  WHERE cr.date > '${yesterdayYMD()}' AND cr.date <= '${todayYMD()}'
  GROUP BY cr.campaign_id
)
SELECT agg_fb.campaign_id,
  MAX(agg_fb.campaign_name) as campaign_name,
  SUM(agg_fb.total_spent) as total_spent,
  SUM(agg_fb.link_clicks) as link_clicks,
  ROUND(SUM(agg_cr.revenue)::decimal, 2) as revenue,
  SUM(agg_fbc.dt_revenue) as dt_revenue,
  SUM(agg_fbc.conversions) as conversions,
  SUM(agg_fbc.unique_conversions) as unique_conversions,
  SUM(agg_cr.cr_conversions) as cr_conversions,
  ROUND(
    SUM(agg_fb.total_spent)::decimal /
    CASE SUM(agg_fbc.conversions)::decimal WHEN 0 THEN null ELSE SUM(agg_fbc.conversions)::decimal END,
  2) as cpa,
  ROUND(
    SUM(agg_fb.total_spent)::decimal /
    CASE SUM(agg_fb.link_clicks)::decimal WHEN 0 THEN null ELSE SUM(agg_fb.link_clicks)::decimal END,
  2) as cpc,
  ROUND(
    SUM(agg_cr.revenue)::decimal /
    CASE SUM(agg_cr.cr_conversions)::decimal WHEN 0 THEN null ELSE SUM(agg_cr.cr_conversions)::decimal END,
  2) as rpc,
  CEIL(
    SUM(agg_fb.total_spent)::decimal /
    CASE SUM(agg_fb.link_clicks)::decimal WHEN 0 THEN null ELSE SUM(agg_fb.link_clicks)::decimal END * 1000
  ) as cpm,
  CEIL(
    SUM(agg_cr.revenue)::decimal /
    CASE SUM(agg_cr.visitors)::decimal WHEN 0 THEN null ELSE SUM(agg_cr.visitors)::decimal END * 1000
  ) as rpm
FROM agg_fb
  FULL OUTER JOIN agg_fbc USING (campaign_id)
  FULL OUTER JOIN agg_cr USING (campaign_id)
GROUP BY agg_fb.campaign_id
`);

module.exports = aggregateConversionReport;
