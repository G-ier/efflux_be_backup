const db = require('../../data/dbConfig');
const selects = require("./selects");

const mapField = {
  campaign_id: 'sub1',
  adset_id: 'sub3'
}
const aggregateSedoConversionReport = (startDate, endDate, groupBy) => db.raw(`
  WITH agg_pb AS (  
    SELECT fb.${groupBy}      
    FROM facebook as fb
        INNER JOIN campaigns c ON fb.campaign_id = c.id AND c.traffic_source = 'facebook'
    WHERE fb.date > '${startDate}' AND fb.date <= '${endDate}'
    GROUP BY fb.${groupBy}
  ),
  agg_pc AS (  
    SELECT pc.${groupBy},
      CAST(COUNT(CASE WHEN event_name = 'PageView' THEN 1 ELSE null END) AS INTEGER) as step1,
      CAST(COUNT(CASE WHEN event_name = 'ViewContent' THEN 1 ELSE null END) AS INTEGER) as step2
    FROM pixel_clicks as pc
        INNER JOIN campaigns c ON pc.campaign_id = c.id AND c.traffic_source = 'facebook'
    WHERE pc.created_at > '${startDate}' AND pc.created_at <= '${endDate}'
    GROUP BY pc.${groupBy}
  ),
  agg_fbc AS (
    SELECT fbc.${groupBy},
      COUNT(fbc.event_id) as conversions      
    FROM fb_conversions as fbc
        INNER JOIN campaigns c ON fbc.campaign_id = c.id AND c.traffic_source = 'facebook'
    WHERE fbc.date > '${startDate}' AND fbc.date <= '${endDate}'
    GROUP BY fbc.${groupBy}
  ),
  agg_sedo AS (
    SELECT sedo.${mapField[groupBy]},
      COUNT(sedo.id) as conversions,
      SUM(sedo.amount::decimal) as revenue
    FROM sedo_conversions as sedo
        INNER JOIN campaigns c ON sedo.sub1 = c.id AND c.traffic_source = 'facebook'
    WHERE sedo.date > '${startDate}' AND sedo.date <= '${endDate}'
    GROUP BY sedo.${mapField[groupBy]}  
  ),
  agg_s1 AS (
    SELECT s1.${groupBy},
      ${selects.SYSTEM1}
    FROM system1 as s1
        INNER JOIN campaigns c ON s1.campaign_id = c.id AND c.traffic_source = 'facebook'
    WHERE s1.date > '${startDate}' AND s1.date <= '${endDate}'
    GROUP BY s1.${groupBy}
  ),
  agg_pb_1 AS (
    SELECT pb_1.${groupBy},
      SUM(pb_1.pb_value::decimal) as payout
    FROM postback_events as pb_1        
    WHERE pb_1.date > '${startDate}' AND pb_1.date <= '${endDate}'
    GROUP BY pb_1.${groupBy}
  ),
  agg_pb_s1 AS (
    SELECT pb_s1.${groupBy},
      CAST(COUNT(CASE WHEN event_name = 'lead' THEN 1 ELSE null END) AS INTEGER) as pb_conversions
    FROM s1_conversions as pb_s1
           INNER JOIN campaigns c ON pb_s1.campaign_id = c.id AND c.traffic_source = 'facebook'
    WHERE pb_s1.date > '${startDate}' AND pb_s1.date <= '${endDate}'
    GROUP BY pb_s1.${groupBy}
   )
  SELECT agg_pb.${groupBy},
    SUM(agg_sedo.conversions) as sedo_conversion,
    ROUND(SUM(agg_sedo.revenue)::decimal, 2) as sedo_revenue,
    SUM(agg_pc.step1) as pb_step1,  
    SUM(agg_pc.step2) as pb_step2,  
    SUM(agg_pb_s1.pb_conversions) as pb_conversion,
    ROUND(SUM(agg_pb_1.payout)::decimal, 2) as pb_payout,
    (CASE WHEN SUM(agg_s1.conversions) IS null THEN 0 ELSE CAST(SUM(agg_s1.conversions) AS FLOAT) END) as s1_conversions,
    ROUND(
      SUM(agg_s1.revenue)::decimal /
      CASE SUM(agg_s1.conversions)::decimal WHEN 0 THEN null ELSE SUM(agg_s1.conversions)::decimal END,
    2) as s1_rpc,
    (CASE WHEN SUM(agg_s1.revenue) IS null THEN 0 ELSE CAST(SUM(agg_s1.revenue) AS FLOAT) END) as s1_revenue
  FROM agg_pb
    FULL OUTER JOIN agg_fbc USING (${groupBy})    
    FULL OUTER JOIN agg_pc USING (${groupBy})    
    FULL OUTER JOIN agg_pb_1 USING (${groupBy})    
    FULL OUTER JOIN agg_s1 USING (${groupBy})    
    FULL OUTER JOIN agg_pb_s1 USING (${groupBy})    
    FULL OUTER JOIN agg_sedo ON agg_sedo.${mapField[groupBy]} = agg_pb.${groupBy}
  GROUP BY agg_pb.${groupBy}
`);

module.exports = aggregateSedoConversionReport;
