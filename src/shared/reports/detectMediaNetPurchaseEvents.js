
const detectMediaNetPurchaseEvents = async (database, date, traffic_source) => {

  const QUERY = `
    SELECT
      campaign_name,
      campaign_id,
      unique_identifier as id,
      session_id,
      traffic_source,
      country_code,
      region AS state,
      city,
      ip,
      user_agent,
      pixel_id,
      timestamp,
      external,
      conversions - reported_conversions AS purchase_event_count,
      revenue - reported_amount AS purchase_event_value
    FROM
      medianet_raw_insights
    WHERE
      conversions > 0
      AND reported_conversions < conversions
      AND revenue > 0
      AND date = '${date}'
      AND traffic_source = '${traffic_source}'
      AND valid_pixel = true
  `

  const result = await database.raw(QUERY)
  return result.rows
}

module.exports = detectMediaNetPurchaseEvents
