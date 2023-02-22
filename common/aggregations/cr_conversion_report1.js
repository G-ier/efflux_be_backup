const db = require('../../data/dbConfig');
const selects = require("./selects");

const aggregateCRConversionReport = (startDate, endDate, groupBy) => db.raw(`
WITH agg_fb AS (
  SELECT fb.${groupBy},
    MAX(c.name) as campaign_name,
    ${selects.FACEBOOK}
  FROM facebook as fb
    INNER JOIN campaigns c ON fb.campaign_id = c.id AND
        c.network = 'crossroads' AND
        c.traffic_source = 'facebook'
  WHERE fb.date > '${startDate}' AND fb.date <= '${endDate}'
  GROUP BY fb.${groupBy}
),
agg_fbc AS (
  SELECT fbc.${groupBy},
    ${selects.FACEBOOK_CONVERSIONS}
  FROM fb_conversions as fbc
    INNER JOIN campaigns c ON fbc.campaign_id = c.id AND
     c.network = 'crossroads' AND
     c.traffic_source = 'facebook'
  WHERE fbc.date > '${startDate}' AND fbc.date <= '${endDate}'
  GROUP BY fbc.${groupBy}
),
agg_cr AS (
  SELECT cr.${groupBy},
    ${selects.CROSSROADS},
    MAX(cc.id) as cr_campaign_id,
    MAX(cc.name) as cr_campaign_name
  FROM crossroads_stats as cr
    INNER JOIN campaigns c ON cr.campaign_id = c.id AND
        c.network = 'crossroads' AND
        c.traffic_source = 'facebook'
    INNER JOIN crossroads_campaigns cc ON cr.crossroads_campaign_id = cc.id
  WHERE cr.request_date > '${startDate}' AND cr.request_date <= '${endDate}'
  GROUP BY cr.${groupBy}
)
SELECT
  (CASE
    WHEN agg_fb.${groupBy} IS NOT null THEN agg_fb.${groupBy} ELSE CAST(MAX(agg_cr.cr_campaign_id) AS VARCHAR)
  END) as ${groupBy},
  (CASE
    WHEN MAX(agg_fb.campaign_name) IS NOT null THEN MAX(agg_fb.campaign_name) ELSE MAX(agg_cr.cr_campaign_name)
  END) as campaign_name,
  (CASE WHEN SUM(agg_fb.spend) IS null THEN 0 ELSE CAST(SUM(agg_fb.spend) AS FLOAT) END) as total_spent,
  (CASE WHEN SUM(agg_fb.link_clicks) IS null THEN 0 ELSE CAST(SUM(agg_fb.link_clicks) AS FLOAT) END) as link_clicks,
  (CASE WHEN SUM(agg_fb.ts_conversions) IS null THEN 0 ELSE CAST(SUM(agg_fb.ts_conversions) AS FLOAT) END) as ts_conversions,
  (CASE WHEN SUM(agg_fb.impressions) IS null THEN 0 ELSE CAST(SUM(agg_fb.impressions) AS FLOAT) END)  as fb_impressions,
  (CASE WHEN SUM(agg_cr.revenue) IS null THEN 0 ELSE CAST(SUM(agg_cr.revenue) AS FLOAT) END) as revenue,
  (CASE WHEN SUM(agg_cr.conversions) IS null THEN 0 ELSE CAST(SUM(agg_cr.conversions) AS FLOAT) END) as cr_conversions,
  (CASE WHEN SUM(agg_cr.uniq_conversions) IS null THEN 0 ELSE CAST(SUM(agg_cr.uniq_conversions) AS FLOAT) END)  as cr_unique_conversions,
  (CASE WHEN SUM(agg_cr.tracked_visitors) IS null THEN 0 ELSE CAST(SUM(agg_cr.tracked_visitors) AS FLOAT)  END)  as visitors,
  (CASE WHEN SUM(agg_fbc.pb_conversions) IS null THEN 0 ELSE CAST(SUM(agg_fbc.pb_conversions) AS FLOAT) END) as pb_conversions,
  (CASE WHEN SUM(agg_fbc.pb_uniq_conversions) IS null THEN 0 ELSE CAST(SUM(agg_fbc.pb_uniq_conversions) AS FLOAT) END)  as pb_unique_conversions
FROM agg_fb
  FULL OUTER JOIN agg_fbc USING (${groupBy})
  FULL OUTER JOIN agg_cr USING (${groupBy})
GROUP BY agg_fb.${groupBy}, agg_cr.${groupBy}, agg_fbc.${groupBy}
`);

module.exports = aggregateCRConversionReport;
