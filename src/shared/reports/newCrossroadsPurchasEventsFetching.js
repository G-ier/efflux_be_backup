
const newDetectCrossroadsPurchaseEvents = async (database, date, traffic_source) => {

  const QUERY = `
  SELECT 
  campaign_id
  campaign_name,
  unique_identifier as id,
  traffic_source
  ip,
  country_code,
  region,
  city,
  user_agent,
  pixel_id,
  timestamp,
  conversions,
  revenue,
  external
  FROM
  crossroads_raw_insights
  WHERE       
  conversions > 0
  AND date = '${date}'
  AND traffic_source = '${traffic_source}'
  `

  const result = await database.raw(QUERY)
  return result.rows
}

module.exports = newDetectCrossroadsPurchaseEvents
