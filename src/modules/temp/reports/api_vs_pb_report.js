

const api_vs_pb_report = async (database, date, hour, campaign_ids) => {

  const query = `
      -- Post Back vs. API Change Over Time Analysis

      -- API Data Aggregated by IP
      WITH api_sessions AS (
        SELECT
          tg2 as campaign_id,
          tg3 as sessions_id,
          tg4 as ip,
          SUM(total_visitors) AS total_visitors,
          SUM(tracked_visitors) AS tracked_visitors,
          SUM(lander_visitors) AS lander_visitors,
          SUM(lander_searches) AS lander_searches,
          SUM(revenue_clicks) AS revenue_clicks,
          SUM(publisher_revenue_amount) AS revenue
        FROM raw_crossroads_data
        WHERE date = '${date}' AND tg2 IN ${campaign_ids}
        GROUP BY tg2, tg3, tg4
        ORDER BY total_visitors
      )

      -- Post Back Data Aggregated by IP
      , postback_sessions AS (
        SELECT
          campaign_id,
          fbclid as session_id,
          ip,
          CAST(COUNT(CASE WHEN event_type = 'PageView' THEN 1 ELSE null END) AS INTEGER) as pb_lander_conversions,
          CAST(COUNT(CASE WHEN event_type = 'ViewContent' THEN 1 ELSE null END) AS INTEGER) as pb_serp_conversions,
          CAST(COUNT(CASE WHEN event_type = 'Purchase' THEN 1 ELSE null END) AS INTEGER) as pb_conversions,
          SUM(CASE WHEN event_type = 'Purchase' THEN pb_value ELSE 0 END) AS revenue
        FROM postback_events
        WHERE date = '${date}' AND campaign_id IN ${campaign_ids}
        GROUP BY campaign_id, fbclid, ip
      )

      SELECT
        ${date} AS date,
        ${hour} AS hour,
        COALESCE(api_s.campaign_id, pb_s.campaign_id, 'Unkown') as campaign_id,
        COALESCE(api_s.ip, pb_s.ip, 'Unkown') AS ip,
        COALESCE(api_s.session_id, pb_s.session_id, 'Unkown') as session_id,

        SUM(api_s.total_visitors) as api_visitors,
        SUM(api_s.tracked_visitors) as api_t_visitors,
        SUM(api_s.lander_visitors) as api_landers,
        SUM(pb_s.pb_lander_conversions) as pb_landers,

        SUM(api_s.lander_searches) as api_searches,
        SUM(pb_s.pb_serp_conversions) as pb_searches,

        SUM(api_s.revenue_clicks) as api_purchase,
        SUM(pb_s.pb_conversions) as pb_purchase,

        SUM(api_s.revenue) as api_revenue,
        SUM(pb_s.revenue) as pb_revenue,
        CONCAT(sd.ip, '-', sd.session_id, '-', '${date}', '-', '${hour}') AS unique_identifier

      FROM api_sessions api_s
      FULL OUTER JOIN postback_sessions pb_s ON api_s.ip = pb_s.ip AND api_s.session_id = pb_s.session_id AND api_s.campaign_id = pb_s.campaign_id
      GROUP BY api_s.ip, api_s.session_id, pb_s.ip, pb_s.session_id, api_s.campaign_id, pb_s.campaign_id
    ----------------------------------------------------------------------------------------------------------------------------------------------------------------
  `
  const data = await database.raw(query)
  return data.rows
}

module.exports = {
  api_vs_pb_report
}

