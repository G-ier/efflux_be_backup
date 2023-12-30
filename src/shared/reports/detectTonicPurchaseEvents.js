
const detectTonicPurchaseEvents = async (database, date, traffic_source) => {

  const QUERY = `
    SELECT
      campaign_name,
      campaign_id,
      unique_identifier as id,
      session_id,
      traffic_source,
      country_code,
      region AS state,
      keyword_clicked as keyword,
      tc.vertical as vertical,
      city,
      ip,
      user_agent,
      pixel_id,
      timestamp,
      external,
      conversions - reported_conversions AS purchase_event_count,
      revenue - reported_amount AS purchase_event_value
    FROM
      tonic_raw_insights
    INNER JOIN
      tonic_campaigns tc ON tc.ID = tonic_raw_insights.tonic_campaign_id
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

module.exports = detectTonicPurchaseEvents
