
const newDetectCrossroadsPurchaseEvents = async (database, date, traffic_source) => {

  const QUERY = `
    SELECT
      i.campaign_id,
      i.campaign_name,
      i.unique_identifier as id,
      i.session_id,
      keyword_clicked as keyword,
      i.traffic_source,
      i.ip,
      i.country_code,
      i.region AS state,
      i.city,
      i.user_agent,
      i.pixel_id,
      i.timestamp,
      (i.conversions - i.reported_conversions) as purchase_event_count,
      (i.revenue - i.reported_amount) as purchase_event_value,
      split_part(external, '_|_', 1) as external,
      gtmtr.fbc,
      gtmtr.fbp,
      cr.vertical,
      cr.category
    FROM
      crossroads_raw_insights i
    FULL OUTER JOIN
      gtm_fb_cookie_values gtmtr ON i.session_id = gtmtr.session_id
    LEFT JOIN
      crossroads_campaigns cr ON cr.id = i.crossroads_campaign_id
    WHERE
      date = '${date}'
      AND i.conversions - i.reported_conversions > 0
      AND i.traffic_source = '${traffic_source}'
      AND valid_pixel = true;
  `

  const result = await database.raw(QUERY)
  return result.rows
}

module.exports = newDetectCrossroadsPurchaseEvents
