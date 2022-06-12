const db = require('../../data/dbConfig');
const {WHERE_BY_NETWORK, FACEBOOK, FACEBOOK_CONVERSIONS, CROSSROADS} = require("./selects");
const mapField = {
  campaign_id: 'sub1',
  adset_id: 'sub3'
}

const aggregatePostbackConversionReport = (startDate, endDate, yestStartDate, groupBy, accounts, network, timezone) =>{
switch(network){
  case 'crossroads':
    return db.raw(`
    WITH agg_fb AS (
      SELECT fb.${groupBy},
        MAX(c.name) as campaign_name,
        MAX(c.status) as status,
        MAX(ada.name) as ad_account_name,
        MAX(ada.tz_offset) as time_zone,           
        MAX(c.network) as network,
        ${FACEBOOK}
      FROM facebook as fb
        INNER JOIN campaigns c ON fb.campaign_id = c.id AND            
            c.traffic_source = 'facebook'
        INNER JOIN ad_accounts ada ON ada.account_id = '20' AND fb.ad_account_id = ada.fb_account_id AND ada.fb_account_id = ANY('{${accounts}}')
      WHERE ${WHERE_BY_NETWORK({network, startDate, endDate, yestStartDate, timezone})}      
      GROUP BY fb.${groupBy}
    ),
    agg_fc AS (
      SELECT fc.${groupBy},      
      CAST(ROUND(MAX(fc.cost_per_conversion)::decimal, 2) AS FLOAT) as fb_cost_per_conversion
      FROM facebook_conversion as fc
        INNER JOIN campaigns c ON fc.campaign_id = c.id AND c.traffic_source = 'facebook'
      WHERE fc.date > '${startDate}' AND fc.date <= '${endDate}'
      GROUP BY fc.${groupBy}
    ),
    agg_fbc AS (
      SELECT fbc.${groupBy},
        ${FACEBOOK_CONVERSIONS}
      FROM fb_conversions as fbc
        INNER JOIN campaigns c ON fbc.campaign_id = c.id AND         
         c.traffic_source = 'facebook'
      WHERE fbc.date > '${startDate}' AND fbc.date <= '${endDate}'
      GROUP BY fbc.${groupBy}
    ),
    agg_cr AS (
      SELECT cr.${groupBy},
        ${CROSSROADS},
        MAX(cc.id) as cr_campaign_id,
        MAX(cc.name) as cr_campaign_name
      FROM crossroads_stats as cr
        INNER JOIN campaigns c ON cr.campaign_id = c.id AND            
            c.traffic_source = 'facebook'
        INNER JOIN crossroads_campaigns cc ON cr.crossroads_campaign_id = cc.id
      WHERE cr.request_date > '${startDate}' AND cr.request_date <= '${endDate}'
      GROUP BY cr.${groupBy}
    ),
    agg_cr2 AS (
      SELECT cr.${groupBy},
        ${CROSSROADS},
        MAX(cc.id) as cr_campaign_id,
        MAX(cc.name) as cr_campaign_name
      FROM crossroads_stats as cr
        INNER JOIN campaigns c ON cr.campaign_id = c.id AND            
            c.traffic_source = 'facebook'
        INNER JOIN crossroads_campaigns cc ON cr.crossroads_campaign_id = cc.id
      WHERE cr.request_date > '${yestStartDate}' AND cr.request_date <= '${startDate}'
      GROUP BY cr.${groupBy}
    )
    SELECT
      (CASE
        WHEN agg_fb.${groupBy} IS NOT null THEN agg_fb.${groupBy} ELSE CAST(MAX(agg_cr.cr_campaign_id) AS VARCHAR)
      END) as ${groupBy},
      MAX(agg_fb.date) as date,      
      (CASE
        WHEN MAX(agg_fb.campaign_name) IS NOT null THEN MAX(agg_fb.campaign_name) ELSE MAX(agg_cr.cr_campaign_name)
      END) as campaign_name,
      MAX(agg_fb.network) as network,
      MAX(agg_fb.status) as status,
      MAX(agg_fb.ad_account_name) as ad_account_name,
      MAX(agg_fb.time_zone) as time_zone,
      (CASE WHEN SUM(agg_fb.link_clicks) IS null THEN 0 ELSE CAST(SUM(agg_fb.link_clicks) AS FLOAT) END) as link_clicks,
      (CASE WHEN SUM(agg_fb.impressions) IS null THEN 0 ELSE CAST(SUM(agg_fb.impressions) AS FLOAT) END)  as fb_impressions,
      (CASE WHEN SUM(agg_fb.fb_conversions) IS null THEN 0 ELSE CAST(SUM(agg_fb.fb_conversions) AS FLOAT) END) as fb_conversions,
      (CASE WHEN SUM(agg_fb.fb_lead) IS null THEN 0 ELSE CAST(SUM(agg_fb.fb_lead) AS INTEGER) END) as fb_lead,
      (
        CASE WHEN SUM(agg_fb.fb_conversions) IS null THEN 0 ELSE CAST(SUM(agg_fb.fb_conversions) AS FLOAT) END * 
        CASE WHEN SUM(agg_fc.fb_cost_per_conversion) IS null THEN 0 ELSE CAST(SUM(agg_fc.fb_cost_per_conversion) AS FLOAT) END 
      ) as fb_conversion_amount,
      (CASE WHEN SUM(agg_fb.spend) IS null THEN 0 ELSE CAST(SUM(agg_fb.spend) AS FLOAT) END) as amount_spent,
      MAX(agg_fb.last_updated) as last_updated,
      (CASE WHEN SUM(agg_fbc.pb_conversion) IS null THEN 0 ELSE CAST(SUM(agg_fbc.pb_conversion) AS FLOAT) END) as cr_pb_conversion,
      MAX(agg_fbc.last_updated) as cr_pb_last_updated,      
      (CASE WHEN SUM(agg_cr.revenue) IS null THEN 0 ELSE CAST(SUM(agg_cr.revenue) AS FLOAT) END) as cr_revenue,
      (CASE WHEN SUM(agg_cr.conversions) IS null THEN 0 ELSE CAST(SUM(agg_cr.conversions) AS FLOAT) END) as cr_conversion,
      (CASE WHEN SUM(agg_cr2.revenue) IS null THEN 0 ELSE CAST(SUM(agg_cr2.revenue) AS FLOAT) END) as cr_revenue_y,
      (CASE WHEN SUM(agg_cr2.conversions) IS null THEN 0 ELSE CAST(SUM(agg_cr2.conversions) AS FLOAT) END) as cr_conversion_y,
      MAX(agg_cr.last_updated) as cr_last_updated      
    FROM agg_fb
      FULL OUTER JOIN agg_fbc USING (${groupBy})
      FULL OUTER JOIN agg_fc USING (${groupBy})
      FULL OUTER JOIN agg_cr USING (${groupBy})
      FULL OUTER JOIN agg_cr2 USING (${groupBy})
    GROUP BY agg_fb.${groupBy}`);
  
  
    default:
    return db.raw(`
  WITH agg_fb AS (
    SELECT fb.${groupBy},
      MAX(fb.date) as date,
      MAX(fb.updated_at) as last_updated,
      MAX(c.name) as campaign_name,
      MAX(c.status) as status,
      MAX(ada.name) as ad_account_name,
      MAX(ada.tz_offset) as time_zone,
      CAST(SUM(fb.link_clicks) AS INTEGER) as link_clicks,
      CAST(SUM(fb.impressions) AS INTEGER) as impressions,
      (CASE WHEN SUM(fb.lead) IS null THEN 0 ELSE CAST(SUM(fb.lead) AS INTEGER) END) as fb_lead,    
      CAST(SUM(fb.conversions) AS INTEGER) as fb_conversions,      
      MAX(c.network) as network,
      CAST(ROUND(SUM(fb.total_spent)::decimal, 2) AS FLOAT) as spend
    FROM facebook as fb
      INNER JOIN campaigns c ON fb.campaign_id = c.id AND c.traffic_source = 'facebook'
      INNER JOIN ad_accounts ada ON ada.account_id = '20' AND fb.ad_account_id = ada.fb_account_id AND ada.fb_account_id = ANY('{${accounts}}')
    WHERE 
      ${WHERE_BY_NETWORK({network, startDate, endDate, yestStartDate, timezone})}           
    GROUP BY fb.${groupBy}
  ),
  agg_fc AS (
    SELECT fc.${groupBy},      
    CAST(ROUND(MAX(fc.cost_per_conversion)::decimal, 2) AS FLOAT) as fb_cost_per_conversion
    FROM facebook_conversion as fc
      INNER JOIN campaigns c ON fc.campaign_id = c.id AND c.traffic_source = 'facebook'
    WHERE fc.date > '${startDate}' AND fc.date <= '${endDate}'
    GROUP BY fc.${groupBy}
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
    (CASE WHEN SUM(agg_fb.link_clicks) IS null THEN 0 ELSE CAST(SUM(agg_fb.link_clicks) AS FLOAT) END) as link_clicks,    
    (CASE WHEN SUM(agg_fb.impressions) IS null THEN 0 ELSE CAST(SUM(agg_fb.impressions) AS FLOAT) END) as fb_impressions,
    (CASE WHEN SUM(agg_fb.fb_conversions) IS null THEN 0 ELSE CAST(SUM(agg_fb.fb_conversions) AS FLOAT) END) as fb_conversions,
    (CASE WHEN SUM(agg_fb.fb_lead) IS null THEN 0 ELSE CAST(SUM(agg_fb.fb_lead) AS INTEGER) END) as fb_lead,
    (
      CASE WHEN SUM(agg_fb.fb_conversions) IS null THEN 0 ELSE CAST(SUM(agg_fb.fb_conversions) AS FLOAT) END * 
      CASE WHEN SUM(agg_fc.fb_cost_per_conversion) IS null THEN 0 ELSE CAST(SUM(agg_fc.fb_cost_per_conversion) AS FLOAT) END 
    ) as fb_conversion_amount,
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
    (CASE WHEN SUM(agg_sd.conversion) IS null THEN 0 ELSE CAST(SUM(agg_sd.conversion) AS FLOAT) END) as sd_conversion,
    (CASE WHEN SUM(agg_sd.revenue) IS null THEN 0 ELSE CAST(SUM(agg_sd.revenue) AS FLOAT) END) as sd_revenue,     
    MAX(agg_sd2.campaign) as sd_campaign_y,
    (CASE WHEN SUM(agg_sd2.conversion) IS null THEN 0 ELSE CAST(SUM(agg_sd2.conversion) AS FLOAT) END) as sd_conversion_y,
    (CASE WHEN SUM(agg_sd2.revenue) IS null THEN 0 ELSE CAST(SUM(agg_sd2.revenue) AS FLOAT) END) as sd_revenue_y, 
    MAX(agg_sedo.last_updated) as sd_pb_last_updated,
    (CASE WHEN SUM(agg_sedo.conversion) IS null THEN 0 ELSE CAST(SUM(agg_sedo.conversion) AS FLOAT) END) as sd_pb_conversion,   
    (CASE WHEN SUM(agg_sedo.revenue) IS null THEN 0 ELSE CAST(SUM(agg_sedo.revenue) AS FLOAT) END) as sd_pb_revenue
    
  FROM agg_fb 
    FULL OUTER JOIN agg_fc USING (${groupBy})
    FULL OUTER JOIN agg_s1 USING (${groupBy})
    FULL OUTER JOIN agg_s2 USING (${groupBy})
    FULL OUTER JOIN agg_pb_s1 USING (${groupBy})
    FULL OUTER JOIN agg_sedo ON agg_sedo.${mapField[groupBy]} = agg_fb.${groupBy}  
    FULL OUTER JOIN agg_sd ON agg_sd.${mapField[groupBy]} = agg_fb.${groupBy}  
    FULL OUTER JOIN agg_sd2 ON agg_sd2.${mapField[groupBy]} = agg_fb.${groupBy}  
  GROUP BY agg_fb.${groupBy}
`);
}

  }
module.exports = aggregatePostbackConversionReport;
