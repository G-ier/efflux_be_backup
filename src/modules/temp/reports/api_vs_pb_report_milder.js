
const api_vs_pb_mild_report = async (database, date, hour, campaign_ids) => {
  const query = `
    -- IP Binding report (USER LEVEL REPORT)
    WITH api_sessions AS (
      SELECT
        tg2 as campaign_id,
        tg3 as session_id,
        SUM(total_visitors) AS total_visitors,
        SUM(tracked_visitors) AS tracked_visitors,
        SUM(lander_visitors) AS lander_visitors,
        SUM(lander_searches) AS lander_searches,
        SUM(revenue_clicks) AS revenue_clicks,
        SUM(publisher_revenue_amount) AS revenue
      FROM raw_crossroads_data
      WHERE date = '${date}' AND tg2 IN ${campaign_ids}
      GROUP BY tg2, tg3
      ORDER BY total_visitors
    ),

    postback_sessions AS (
      SELECT
        campaign_id,
        ip,
        fbclid as session_id,
        CAST(COUNT(CASE WHEN event_type = 'PageView' THEN 1 ELSE null END) AS INTEGER) as pb_lander_conversions,
        CAST(COUNT(CASE WHEN event_type = 'ViewContent' THEN 1 ELSE null END) AS INTEGER) as pb_serp_conversions,
        CAST(COUNT(CASE WHEN event_type = 'Purchase' THEN 1 ELSE null END) AS INTEGER) as pb_conversions,
        SUM(CASE WHEN event_type = 'Purchase' THEN pb_value ELSE 0 END) AS revenue
      FROM postback_events
      WHERE date = '${date}' AND campaign_id IN ${campaign_ids}
      GROUP BY campaign_id, fbclid, ip
    ),

    session_data AS (
      SELECT
        COALESCE(p.ip, 'Unkown') AS ip,
        COALESCE(a.session_id, p.session_id, 'Unkown') as session_id,
        COALESCE(a.campaign_id, p.campaign_id, 'Unkown') as campaign_id,

        a.total_visitors as api_visitors,
        a.tracked_visitors as api_t_visitors,
        a.lander_visitors as api_landers,
        p.pb_lander_conversions as pb_landers,

        a.lander_searches as api_searches,
        p.pb_serp_conversions as pb_searches,

        a.revenue_clicks as api_purchase,
        p.pb_conversions as pb_purchase,

        a.revenue as api_revenue,
        p.revenue as pb_revenue

      FROM api_sessions a
      FULL OUTER JOIN postback_sessions p ON a.session_id = p.session_id AND a.campaign_id = p.campaign_id
    )

    SELECT

      '${date}' AS date,
      ${hour} AS hour,
      sd.campaign_id as campaign_id,
      sd.ip AS ip,
      sd.session_id as session_id,

      COALESCE(SUM(sd.api_visitors), 0) as api_visitors,
      COALESCE(SUM(sd.api_t_visitors), 0) as api_t_visitors,
      COALESCE(SUM(sd.api_landers), 0) as api_landers,
      COALESCE(SUM(sd.pb_landers), 0) as pb_landers,

      COALESCE(SUM(sd.api_searches), 0) as api_searches,
      COALESCE(SUM(sd.pb_searches), 0) as pb_searches,

      COALESCE(SUM(sd.api_purchase), 0) as api_purchase,
      COALESCE(SUM(sd.pb_purchase), 0) as pb_purchase,

      COALESCE(SUM(sd.api_revenue), 0) as api_revenue,
      COALESCE(SUM(sd.pb_revenue), 0) as pb_revenue,
      CONCAT(sd.ip, '-', sd.session_id, '-', '${date}', '-', '${hour}') AS unique_identifier

    FROM session_data sd
    GROUP BY sd.campaign_id, sd.session_id, sd.ip
    ORDER BY SUM(sd.pb_purchase) DESC;

    ------------------------------------------------------------------------------------------------------------------------------------------
  `
  const data = await database.raw(query)
  return data.rows
}

module.exports = {
  api_vs_pb_mild_report
}
