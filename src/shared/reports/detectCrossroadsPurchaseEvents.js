
const detectCrossroadsPurchaseEvents = async (database, date, traffic_source) => {

  const QUERY = `
    SELECT
      tg1 as campaign_name,
      tg2 as campaign_id,
      tg3 as session_id,
      unique_identifier as id,
      lander_keyword as keyword,
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
      split_part(tg10, '_|_', 1) as external,
      gtmtr.fbc as fbc,
      gtmtr.fbp as fbp,
      revenue_clicks - reported_conversions AS purchase_event_count,
      publisher_revenue_amount - reported_amount AS purchase_event_value
    FROM
      raw_crossroads_data
    FULL OUTER JOIN
    	gtm_fb_cookie_values gtmtr ON raw_crossroads_data.tg3 = gtmtr.session_id
    WHERE
      revenue_clicks > 0
      AND reported_conversions < revenue_clicks
      AND publisher_revenue_amount > 0
      AND date = '${date}'
      AND traffic_source = '${traffic_source}'
      AND valid_pixel = true
  `

  const result = await database.raw(QUERY)
  return result.rows
}

module.exports = detectCrossroadsPurchaseEvents
