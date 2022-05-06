const db = require('../../data/dbConfig');
const selects = require("./selects");

const aggregateSystem1ConversionReport = (startDate, endDate, groupBy) => db.raw(`
  WITH agg_fb AS (
    SELECT fb.${groupBy},
      MAX(c.name) as campaign_name,
      ${selects.FACEBOOK}
    FROM facebook as fb
      INNER JOIN campaigns c ON fb.campaign_id = c.id AND c.network = 'system1'
    WHERE fb.date > '${startDate}' AND fb.date <= '${endDate}'
    GROUP BY fb.${groupBy}
  ),
  agg_s1 AS (
    SELECT s1.${groupBy},
      ${selects.SYSTEM1}
    FROM system1 as s1
        INNER JOIN campaigns c ON s1.campaign_id = c.id AND c.traffic_source = 'facebook'
    WHERE s1.date > '${startDate}' AND s1.date <= '${endDate}'
    GROUP BY s1.${groupBy}
  ),
  agg_pb_s1 AS (
   SELECT pb_s1.${groupBy},
     ${selects.PB_SYSTEM1}
   FROM s1_conversions as pb_s1
          INNER JOIN campaigns c ON pb_s1.campaign_id = c.id AND c.traffic_source = 'facebook'
   WHERE pb_s1.date > '${startDate}' AND pb_s1.date <= '${endDate}'
   GROUP BY pb_s1.${groupBy}
  )
  SELECT agg_fb.${groupBy},
    MAX(agg_fb.campaign_name) as campaign_name,
    (CASE WHEN SUM(agg_fb.spend) IS null THEN 0 ELSE CAST(SUM(agg_fb.spend) AS FLOAT) END) as total_spent,
    (CASE WHEN SUM(agg_fb.link_clicks) IS null THEN 0 ELSE CAST(SUM(agg_fb.link_clicks) AS FLOAT) END) as link_clicks,
    (CASE WHEN SUM(agg_fb.ts_conversions) IS null THEN 0 ELSE CAST(SUM(agg_fb.ts_conversions) AS FLOAT) END) as ts_conversions,
    (CASE WHEN SUM(agg_fb.impressions) IS null THEN 0 ELSE CAST(SUM(agg_fb.impressions) AS FLOAT) END) as fb_impressions,
    (CASE WHEN SUM(agg_s1.revenue) IS null THEN 0 ELSE CAST(SUM(agg_s1.revenue) AS FLOAT) END) as revenue,
    (CASE WHEN SUM(agg_s1.conversions) IS null THEN 0 ELSE CAST(SUM(agg_s1.conversions) AS FLOAT) END) as s1_conversions,
    (CASE WHEN SUM(agg_pb_s1.pb_conversions) IS null THEN 0 ELSE CAST(SUM(agg_pb_s1.pb_conversions) AS FLOAT) END) as pb_conversions,
    (CASE WHEN SUM(agg_pb_s1.pb_searches) IS null THEN 0 ELSE CAST(SUM(agg_pb_s1.pb_searches) AS FLOAT) END) as pb_search,
    (CASE WHEN SUM(agg_pb_s1.pb_impressions) IS null THEN 0 ELSE CAST(SUM(agg_pb_s1.pb_impressions) AS FLOAT) END) as pb_impressions,
    (CASE WHEN SUM(agg_pb_s1.pb_uniq_conversions) IS null THEN 0 ELSE CAST(SUM(agg_pb_s1.pb_uniq_conversions) AS FLOAT) END)  as pb_unique_conversions
  FROM agg_fb
    FULL OUTER JOIN agg_s1 USING (${groupBy})
    FULL OUTER JOIN agg_pb_s1 USING (${groupBy})
  GROUP BY agg_fb.${groupBy}
`);

module.exports = aggregateSystem1ConversionReport;
