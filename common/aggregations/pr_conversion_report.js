const db = require('../../data/dbConfig');

const aggregatePRConversionReport = (startDate, endDate, groupBy) => db.raw(`
  WITH agg_fb AS (
    SELECT fb.${groupBy},
      MAX(c.name) as campaign_name,
      SUM(fb.total_spent) as total_spent,
      ROUND(
        SUM(total_spent)::decimal / CASE SUM(link_clicks)::decimal WHEN 0 THEN null ELSE SUM(link_clicks)::decimal END,
      2) as cpc,
      SUM(fb.link_clicks) as link_clicks,
      SUM(fb.conversions) as conversions,
      SUM(fb.impressions) as impressions
    FROM facebook as fb
      INNER JOIN campaigns c ON fb.campaign_id = c.id AND c.network = 'proper'
    WHERE fb.date > '${startDate}' AND fb.date <= '${endDate}'
    GROUP BY fb.${groupBy}
  ),
  agg_fbc AS (
    SELECT fbc.${groupBy},
      SUM(fbc.dt_value::decimal) as dt_revenue,
      COUNT(fbc.event_id) as conversions,
      COUNT(distinct fbc.fbclid) as unique_conversions
    FROM fb_conversions as fbc
      INNER JOIN campaigns c ON fbc.campaign_id = c.id AND c.network = 'proper' AND c.traffic_source = 'facebook'
    WHERE fbc.date > '${startDate}' AND fbc.date <= '${endDate}'
    GROUP BY fbc.${groupBy}
  ),
  agg_pr AS (
    SELECT pr.${groupBy},
     SUM(pr.revenue)::decimal as revenue,
     SUM(pr.visitors) as visitors
    FROM proper as pr
        INNER JOIN campaigns c ON pr.campaign_id = c.id AND c.traffic_source = 'facebook'
    WHERE pr.date > '${startDate}' AND pr.date <= '${endDate}'
    GROUP BY pr.${groupBy}
  )
  SELECT agg_fb.${groupBy},
    campaign_name,
    ROUND(SUM(agg_fb.total_spent)::decimal, 2) as total_spent,
    SUM(agg_fb.link_clicks) as link_clicks,
    ROUND(SUM(agg_pr.revenue)::decimal, 2) as revenue,
    ROUND((SUM(agg_pr.revenue)::decimal - SUM(agg_fb.total_spent))::decimal, 2) as profit,
    SUM(agg_fbc.conversions) as conversions,
    SUM(agg_fbc.unique_conversions) as unique_conversions,
    SUM(agg_fb.conversions) as ts_conversions,
    SUM(agg_fb.impressions) as impressions,
    ROUND(
      SUM(agg_fb.link_clicks)::decimal /
      CASE SUM(agg_fb.impressions)::decimal WHEN 0 THEN null ELSE SUM(agg_fb.impressions)::decimal END * 100,
    2) as facebook_ctr,
    ROUND(
      SUM(agg_fb.total_spent)::decimal /
      CASE SUM(agg_fbc.conversions)::decimal WHEN 0 THEN null ELSE SUM(agg_fbc.conversions)::decimal END,
    2) as cpa,
    ROUND(
      SUM(agg_pr.revenue)::decimal /
      CASE SUM(agg_fb.impressions)::decimal WHEN 0 THEN null ELSE SUM(agg_fb.impressions)::decimal END,
    2) as rpi,
    ROUND(
      SUM(agg_fb.total_spent)::decimal /
      CASE SUM(agg_fbc.unique_conversions)::decimal WHEN 0 THEN null ELSE SUM(agg_fbc.unique_conversions)::decimal END,
    2) as unique_cpa,
    ROUND(
      SUM(agg_fb.total_spent)::decimal /
      CASE SUM(agg_fb.link_clicks)::decimal WHEN 0 THEN null ELSE SUM(agg_fb.link_clicks)::decimal END,
    2) as cpc,
    ROUND(
      SUM(agg_fbc.conversions)::decimal /
      CASE SUM(agg_fb.link_clicks)::decimal WHEN 0 THEN null ELSE SUM(agg_fb.link_clicks)::decimal END * 100
    ) as live_ctr,
    CEIL(
      SUM(agg_fb.total_spent)::decimal /
      CASE SUM(agg_fb.link_clicks)::decimal WHEN 0 THEN null ELSE SUM(agg_fb.link_clicks)::decimal END * 1000
    ) as cpm,
    CEIL(
      SUM(agg_pr.revenue)::decimal /
      CASE SUM(agg_pr.visitors)::decimal WHEN 0 THEN null ELSE SUM(agg_pr.visitors)::decimal END * 1000
    ) as rpm,
    ROUND(
      CASE SUM(agg_fb.total_spent)::decimal
      WHEN 0 THEN null ELSE
        (SUM(agg_pr.revenue)::decimal - SUM(agg_fb.total_spent)::decimal) / SUM(agg_fb.total_spent)::decimal * 100
      END
    , 2) as roi
  FROM agg_fb
    FULL OUTER JOIN agg_fbc USING (${groupBy})
    FULL OUTER JOIN agg_pr USING (${groupBy})
  GROUP BY agg_fb.${groupBy}, agg_fb.campaign_name
`);

module.exports = aggregatePRConversionReport;
