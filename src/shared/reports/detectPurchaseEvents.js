
const detectPurchaseEvents = async (database, date, traffic_source) => {

  const QUERY = `
    SELECT
      tg1 as campaign_name,
      tg2 as campaign_id,
      unique_identifier as id,
      traffic_source,
      tg4 as ip,
      CASE
        WHEN traffic_source = 'facebook'
        THEN country_code
        ELSE split_part(tg7, '-', 1) END
      AS country_code,

      CASE
        WHEN traffic_source = 'facebook'
        THEN state
        ELSE split_part(tg7, '-', 2) END
      AS state,

      CASE
        WHEN traffic_source = 'facebook'
        THEN city
        ELSE split_part(tg7, '-', 3) END
      AS city,

      tg8 as user_agent,
      split_part(tg9, '-', 1) as pixel_id,
      split_part(tg9, '-', 2) as timestamp,
      tg10 as external,
      revenue_clicks as purchase_event_count,
      publisher_revenue_amount as purchase_event_value
    FROM
      raw_crossroads_data
    WHERE
      revenue_clicks > 0
      AND reported_to_ts = false
      AND date = '${date}'
      AND traffic_source = '${traffic_source}'
      AND valid_pixel = true
  `

  const result = await database.raw(QUERY)
  return result.rows
}

module.exports = detectPurchaseEvents
