const db = require('../../data/dbConfig');
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
  agg_pb_1 AS (
    SELECT pb_1.${groupBy},
      SUM(pb_1.pb_value::decimal) as payout
    FROM postback_events as pb_1
        INNER JOIN campaigns c ON pb_1.campaign_id = c.id AND c.traffic_source = 'facebook'
    WHERE pb_1.date > '${startDate}' AND pb_1.date <= '${endDate}'
    GROUP BY pb_1.${groupBy}
  )
  SELECT agg_pb.${groupBy},
    SUM(agg_sedo.conversions) as sedo_conversions,
    ROUND(SUM(agg_sedo.revenue)::decimal, 2) as sedo_revenue,
    SUM(agg_pc.step1) as pb_step1,  
    SUM(agg_pc.step2) as pb_step2,  
    SUM(agg_fbc.conversions) as pb_conversions,
    ROUND(SUM(agg_pb_1.payout)::decimal, 2) as pb_payout
  FROM agg_pb
    FULL OUTER JOIN agg_fbc USING (${groupBy})    
    FULL OUTER JOIN agg_pc USING (${groupBy})    
    FULL OUTER JOIN agg_pb_1 USING (${groupBy})    
    FULL OUTER JOIN agg_sedo ON agg_sedo.${mapField[groupBy]} = agg_pb.${groupBy}
  GROUP BY agg_pb.${groupBy}
`);

module.exports = aggregateSedoConversionReport;
