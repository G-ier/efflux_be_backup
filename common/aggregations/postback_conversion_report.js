const db = require('../../data/dbConfig');
const selects = require("./selects");

const aggregatePostbackConversionReport = (startDate, endDate, yestStartDate, groupBy) => db.raw(`
  WITH agg_fb AS (
    SELECT fb.${groupBy},
      MAX(fb.date) as date,
      MAX(fb.updated_at) as last_updated,
      MAX(c.name) as campaign_name,
      MAX(c.status) as status,
      MAX(ada.name) as ad_account_name,
      MAX(ada.tz_offset) as time_zone,
      CAST(ROUND(SUM(fb.total_spent)::decimal, 2) AS FLOAT) as spend
    FROM facebook as fb
      INNER JOIN campaigns c ON fb.campaign_id = c.id AND c.network = 'system1'
      INNER JOIN ad_accounts ada ON fb.ad_account_id = ada.fb_account_id
    WHERE fb.date > '${startDate}' AND fb.date <= '${endDate}'
    GROUP BY fb.${groupBy}
  ),
  agg_s1 AS (
    SELECT s1.${groupBy}, 
      MAX(s1.campaign) as campaign,
      MAX(s1.last_updated) as last_updated,
      CAST(SUM(s1.revenue)::decimal AS FLOAT) as revenue,
      CAST(SUM(s1.clicks) AS INTEGER) as conversion
    FROM system1 as s1
      INNER JOIN campaigns c ON s1.campaign_id = c.id AND c.traffic_source = 'facebook'
    WHERE s1.date > '${startDate}' AND s1.date <= '${endDate}'
    GROUP BY s1.${groupBy}
  ),
  agg_s2 AS (
    SELECT s2.${groupBy},
      MAX(s2.campaign) as campaign,
      CAST(SUM(s2.revenue)::decimal AS FLOAT) as revenue,
      CAST(SUM(s2.clicks) AS INTEGER) as conversion
    FROM system1 as s2
      INNER JOIN campaigns c ON s2.campaign_id = c.id AND c.traffic_source = 'facebook'
    WHERE s2.date > '${yestStartDate}' AND s2.date <= '${startDate}'
    GROUP BY s2.${groupBy}
  ),
  agg_pb_s1 AS (
    SELECT pb_s1.${groupBy},
      MAX(pb_s1.updated_at) as last_updated,
      CAST(COUNT(CASE WHEN event_name = 'lead' THEN 1 ELSE null END) AS INTEGER) as pb_conversion
    FROM s1_conversions as pb_s1
      INNER JOIN campaigns c ON pb_s1.campaign_id = c.id AND c.traffic_source = 'facebook'
    WHERE pb_s1.date > '${startDate}' AND pb_s1.date <= '${endDate}'
    GROUP BY pb_s1.${groupBy}
  )
  SELECT agg_fb.${groupBy},
    MAX(agg_fb.date) as date,
    MAX(agg_fb.campaign_name) as campaign_name,
    MAX(agg_fb.status) as status,
    MAX(agg_fb.ad_account_name) as ad_account_name,
    MAX(agg_fb.time_zone) as time_zone,
    (CASE WHEN SUM(agg_fb.spend) IS null THEN 0 ELSE CAST(SUM(agg_fb.spend) AS FLOAT) END) as amount_spent,
    MAX(agg_fb.last_updated) as last_updated,
    (CASE WHEN SUM(agg_pb_s1.pb_conversion) IS null THEN 0 ELSE CAST(SUM(agg_pb_s1.pb_conversion) AS FLOAT) END) as pb_conversion,
    MAX(agg_pb_s1.last_updated) as pb_last_updated,
    MAX(agg_s1.campaign) as campaign,
    MAX(agg_s2.campaign) as yt_campaign,
    (CASE WHEN SUM(agg_s1.conversion) IS null THEN 0 ELSE CAST(SUM(agg_s1.conversion) AS FLOAT) END) as nt_conversion,
    (CASE WHEN SUM(agg_s2.conversion) IS null THEN 0 ELSE CAST(SUM(agg_s2.conversion) AS FLOAT) END) as s1_yt_conversion,    
    ROUND(
      SUM(agg_s1.revenue)::decimal /
      CASE SUM(agg_s1.conversion)::decimal WHEN 0 THEN null ELSE SUM(agg_s1.conversion)::decimal END,
    2) as rpc,
    ROUND(
      SUM(agg_s2.revenue)::decimal /
      CASE SUM(agg_s2.conversion)::decimal WHEN 0 THEN null ELSE SUM(agg_s2.conversion)::decimal END,
    2) as yt_rpc,    
    (CASE WHEN SUM(agg_s1.revenue) IS null THEN 0 ELSE CAST(SUM(agg_s1.revenue) AS FLOAT) END) as revenue,    
    (CASE WHEN SUM(agg_s2.revenue) IS null THEN 0 ELSE CAST(SUM(agg_s2.revenue) AS FLOAT) END) as yt_revenue,    
    MAX(agg_s1.last_updated) as s1_last_updated,
    ROUND(
      CASE SUM(agg_fb.spend)::decimal
      WHEN 0 THEN null ELSE
        (SUM(agg_s1.revenue)::decimal - SUM(agg_fb.spend)::decimal) / SUM(agg_fb.spend)::decimal * 100
      END
    , 2) as roi
  FROM agg_fb
    FULL OUTER JOIN agg_s1 USING (${groupBy})
    FULL OUTER JOIN agg_s2 USING (${groupBy})
    FULL OUTER JOIN agg_pb_s1 USING (${groupBy})
  GROUP BY agg_fb.${groupBy}
`);

module.exports = aggregatePostbackConversionReport;
