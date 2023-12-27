
const newDetectCrossroadsPurchaseEvents = async (database, date, traffic_source) => {

  const QUERY = `SELECT
  a.fb_account_id as ad_account, 
  i.campaign_id,
  i.campaign_name,
  i.unique_identifier as id,
  i.traffic_source,
  i.ip,
  i.country_code,
  i.region,
  i.city,
  i.user_agent,
  i.pixel_id,
  i.timestamp,
  (i.conversions - i.reported_conversions) as conversions,
  (i.revenue - i.reported_amount) as revenue,
  i.external
  FROM
  crossroads_raw_insights i
  LEFT JOIN campaigns c
  ON i.campaign_id = c.id
  LEFT JOIN ad_accounts a
  ON a.id = c.ad_account_id
  WHERE  
  i.conversions - i.reported_conversions > 0
  AND date = '${date}'
  AND i.traffic_source = '${traffic_source}'
  `

  const result = await database.raw(QUERY)
  return result.rows
}

module.exports = newDetectCrossroadsPurchaseEvents
