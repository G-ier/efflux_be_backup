const { groupBy } = require("lodash");
const db = require("../../data/dbConfig");

function clickflareCampaigns(startDate, endDate, group, traffic_source){ //groupBy, groupByName) {
  let join_source; let select_id; let groupBy;
  if (group === 'campaign'){
    join_source = `(SELECT c.id, c.name, ad.tz_name, ad.tz_offset FROM campaigns c 
      LEFT JOIN ad_accounts ad ON c.ad_account_id = ad.id) tz ON td.tracking_field_3 = tz.id`
    select_id = `GROUPING(td.tracking_field_3) = 1 THEN '1' ELSE td.tracking_field_3 END AS campaign_id,
    CASE WHEN GROUPING(td.tracking_field_3) = 1  THEN 'TOTAL' ELSE MIN(td.tracking_field_6) END as campaign_name`
    groupBy = 'td.tracking_field_3'
  }
  else{
    join_source = `(SELECT c.provider_id, c.name, ad.tz_name, ad.tz_offset FROM adsets c 
      LEFT JOIN ad_accounts ad ON c.ad_account_id = ad.id) tz ON td.tracking_field_2 = tz.provider_id`
    select_id = `GROUPING(td.tracking_field_2) = 1 THEN '1' ELSE td.tracking_field_2 END AS adset_id,
    CASE WHEN GROUPING(td.tracking_field_2) = 1  THEN 'TOTAL' ELSE MIN(td.tracking_field_5) END as adset_name`
    groupBy = 'td.tracking_field_2'
  }
  return db.raw(`
  SELECT CASE WHEN ${select_id},
  CAST(ROUND(SUM(td.conversion_payout), 2) AS FLOAT) as revenue,
  CAST(COUNT(CASE WHEN td.event_type = 'visit' THEN 1 ELSE null END) AS INTEGER) as visits,
  CAST(COUNT(CASE WHEN td.event_type = 'click' THEN 1 ELSE null END) AS INTEGER) as clicks,
  CAST(COUNT(CASE WHEN td.custom_conversion_number = 2 THEN 1 ELSE null END) AS INTEGER) as conversions,
  tz.tz_name as timezone
  FROM tracking_data td
  LEFT JOIN ${join_source}
  WHERE td.visit_time + make_interval(hours => COALESCE(tz.tz_offset, 0)) 
  > '${startDate}' 
  and td.visit_time + make_interval(hours => COALESCE(tz.tz_offset, 0)) 
  < '${endDate}'
  AND td.traffic_source_id in ${traffic_source}
  GROUP BY GROUPING SETS (
    (),
    (${groupBy}, tz.tz_name)
    )
  ORDER BY ${groupBy}
  `)
}

module.exports = {
  clickflareCampaigns
}
