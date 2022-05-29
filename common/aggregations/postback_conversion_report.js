const db = require('../../data/dbConfig');
const selects = require("./selects");
const {tomorrowYMD} = require('./../day')
const mapField = {
  campaign_id: 'sub1',
  adset_id: 'sub3'
}

const aggregatePostbackConversionReport = (startDate, endDate, yestStartDate, groupBy) => db.raw(`
  WITH agg_fb AS (
    SELECT fb.${groupBy},
      MAX(fb.date) as date,
      MAX(fb.updated_at) as last_updated,
      MAX(c.name) as campaign_name,
      MAX(c.status) as status,
      MAX(ada.name) as ad_account_name,
      MAX(ada.tz_offset) as time_zone,
      MAX(c.network) as network,
      CAST(ROUND(SUM(fb.total_spent)::decimal, 2) AS FLOAT) as spend
    FROM facebook as fb
      INNER JOIN campaigns c ON fb.campaign_id = c.id AND c.traffic_source = 'facebook'
      INNER JOIN ad_accounts ada ON fb.ad_account_id = ada.fb_account_id
    WHERE 
      ada.tz_offset >= 0 AND fb.date > '${startDate}' AND fb.date <= '${endDate}' AND hour >=ada.tz_offset  AND c.network = 'system1' OR
      ada.tz_offset >= 0 AND fb.date > '${endDate}' AND fb.date <= '${tomorrowYMD('UTC')}' AND hour < ada.tz_offset AND c.network = 'system1'  OR
      ada.tz_offset < 0 AND fb.date > '${startDate}' AND fb.date <= '${endDate}' AND hour <= 23-ada.tz_offset AND c.network = 'system1'  OR
      ada.tz_offset < 0 AND fb.date > '${yestStartDate}' AND fb.date <= '${startDate}' AND hour > 23-ada.tz_offset AND c.network = 'system1' OR
      c.network != 'system1' AND fb.date > '${startDate}' AND fb.date <= '${endDate}'
    GROUP BY fb.${groupBy}
  ),
  agg_s1 AS (
    SELECT s1.${groupBy},
      MAX(s1.last_updated) as last_updated,
      MAX(s1.campaign) as campaign,
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
  agg_sedo AS (
    SELECT sedo.${mapField[groupBy]},
      COUNT(sedo.id) as conversion,
      MAX(sedo.updated_at) as last_updated,
      SUM(sedo.amount::decimal) as revenue
    FROM sedo_conversions as sedo
        INNER JOIN campaigns c ON sedo.sub1 = c.id AND c.traffic_source = 'facebook'
    WHERE sedo.date > '${startDate}' AND sedo.date <= '${endDate}'
    GROUP BY sedo.${mapField[groupBy]}  
  ),
  agg_sd AS (
    SELECT sd.${mapField[groupBy]},
      CAST(SUM(sd.earnings)::decimal AS FLOAT) as revenue,
      MAX(sd.updated_at) as last_updated,
      MAX(sd.domain) as campaign,
      CAST(SUM(sd.clicks) AS INTEGER) as conversion
    FROM sedo as sd
        INNER JOIN campaigns c ON sd.sub1 = c.id AND c.traffic_source = 'facebook'
    WHERE sd.date > '${startDate}' AND sd.date <= '${endDate}'
    GROUP BY sd.${mapField[groupBy]}  
  ),
  agg_sd2 AS (
    SELECT sd2.${mapField[groupBy]},
      CAST(SUM(sd2.earnings)::decimal AS FLOAT) as revenue,      
      MAX(sd2.domain) as campaign,
      CAST(SUM(sd2.clicks) AS INTEGER) as conversion
    FROM sedo as sd2
        INNER JOIN campaigns c ON sd2.sub1 = c.id AND c.traffic_source = 'facebook'
    WHERE sd2.date > '${yestStartDate}' AND sd2.date <= '${startDate}'
    GROUP BY sd2.${mapField[groupBy]}  
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
    MAX(agg_fb.network) as network,
    MAX(agg_fb.status) as status,
    MAX(agg_fb.ad_account_name) as ad_account_name,
    MAX(agg_fb.time_zone) as time_zone,
    (CASE WHEN SUM(agg_fb.spend) IS null THEN 0 ELSE CAST(SUM(agg_fb.spend) AS FLOAT) END) as amount_spent,
    MAX(agg_fb.last_updated) as last_updated,
    (CASE WHEN SUM(agg_pb_s1.pb_conversion) IS null THEN 0 ELSE CAST(SUM(agg_pb_s1.pb_conversion) AS FLOAT) END) as s1_pb_conversion,
    MAX(agg_pb_s1.last_updated) as s1_pb_last_updated,
    (CASE WHEN SUM(agg_s1.conversion) IS null THEN 0 ELSE CAST(SUM(agg_s1.conversion) AS FLOAT) END) as s1_conversion,
    (CASE WHEN SUM(agg_s2.conversion) IS null THEN 0 ELSE CAST(SUM(agg_s2.conversion) AS FLOAT) END) as s1_conversion_y,     
    (CASE WHEN SUM(agg_s1.revenue) IS null THEN 0 ELSE CAST(SUM(agg_s1.revenue) AS FLOAT) END) as s1_revenue, 
    (CASE WHEN SUM(agg_s2.revenue) IS null THEN 0 ELSE CAST(SUM(agg_s2.revenue) AS FLOAT) END) as s1_revenue_y,    
    MAX(agg_s1.last_updated) as s1_last_updated,    
    MAX(agg_s1.campaign) as s1_campaign,    
    MAX(agg_s2.campaign) as s1_campaign_y,    
    MAX(agg_sd.last_updated) as sd_last_updated,    
    MAX(agg_sd.campaign) as sd_campaign,
    (CASE WHEN SUM(agg_sedo.conversion) IS null THEN 0 ELSE CAST(SUM(agg_sedo.conversion) AS FLOAT) END) as sd_conversion,
    (CASE WHEN SUM(agg_sedo.revenue) IS null THEN 0 ELSE CAST(SUM(agg_sedo.revenue) AS FLOAT) END) as sd_revenue,     
    MAX(agg_sd2.campaign) as sd_campaign_y,
    (CASE WHEN SUM(agg_sd2.conversion) IS null THEN 0 ELSE CAST(SUM(agg_sd2.conversion) AS FLOAT) END) as sd_conversion_y,
    (CASE WHEN SUM(agg_sd2.revenue) IS null THEN 0 ELSE CAST(SUM(agg_sd2.revenue) AS FLOAT) END) as sd_revenue_y, 
    MAX(agg_sedo.last_updated) as sd_pb_last_updated,    
    SUM(agg_sedo.conversion) as sd_pb_conversion,
    ROUND(SUM(agg_sedo.revenue)::decimal, 2) as sd_pb_revenue
  FROM agg_fb
    FULL OUTER JOIN agg_s1 USING (${groupBy})
    FULL OUTER JOIN agg_s2 USING (${groupBy})
    FULL OUTER JOIN agg_pb_s1 USING (${groupBy})
    FULL OUTER JOIN agg_sedo ON agg_sedo.${mapField[groupBy]} = agg_fb.${groupBy}  
    FULL OUTER JOIN agg_sd ON agg_sd.${mapField[groupBy]} = agg_fb.${groupBy}  
    FULL OUTER JOIN agg_sd2 ON agg_sd2.${mapField[groupBy]} = agg_fb.${groupBy}  
  GROUP BY agg_fb.${groupBy}
`);

module.exports = aggregatePostbackConversionReport;
