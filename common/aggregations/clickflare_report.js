const { groupBy } = require("lodash");
const db = require("../../data/dbConfig");

function clickflareCampaigns(startDate, endDate, group, traffic_source){ //groupBy, groupByName) {
  let join_source; let select_id; let groupBy;
  if (group === 'campaign'){
    join_source = `(SELECT c.id, c.name, ad.tz_name, ad.tz_offset FROM campaigns c 
      LEFT JOIN ad_accounts ad ON c.ad_account_id = ad.id) tz ON td.tracking_field_3 = tz.id`
    select_id = `GROUPING(tz.id) = 1 THEN 'TOTAL' WHEN tz.id is null or tz.id = '{{campaign.id}}' THEN 'Missing Campaign ID' ELSE tz.id END AS campaign_id,
    td.tracking_field_6 as campaign_name`
    groupBy = 'tz.id, td.tracking_field_6'
  }
  else{
    join_source = `(SELECT c.provider_id, c.name, ad.tz_name, ad.tz_offset FROM adsets c 
      LEFT JOIN ad_accounts ad ON c.ad_account_id = ad.id) tz ON td.tracking_field_2 = tz.provider_id`
    select_id = `GROUPING(tz.provider_id) = 1 THEN 'TOTAL' WHEN tz.provider_id is null THEN 'Missing Provider ID' ELSE tz.provider_id END AS adset_id,
    td.tracking_field_5 AS adset_name`
    groupBy = 'tz.provider_id, td.tracking_field_5'
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
  `)
}

module.exports = {
  clickflareCampaigns
}
