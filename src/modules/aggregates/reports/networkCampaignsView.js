async function networkCampaignData(database, startDate, endDate, mediaBuyer, network) {

  const query = `
  WITH revenue_aggregated AS (
    SELECT
      MAX(a.network) AS network,
      a.nw_campaign_id,
      MAX(a.nw_campaign_name) AS network_campaign_name,
      CAST(SUM(a.nw_tracked_visitors) AS FLOAT) AS nw_tracked_visitors,
      CAST(SUM(a.nw_kw_clicks) AS FLOAT) AS nw_kw_clicks,
      CAST(SUM(a.nw_conversions) AS FLOAT) AS nw_conversions,
      CAST(SUM(a.revenue) AS FLOAT) AS revenue
    FROM
      analytics a
    WHERE
      DATE(a.timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') > '${startDate}'
      AND DATE(a.timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') <= '${endDate}'
    GROUP BY
      a.nw_campaign_id
  )
  SELECT DISTINCT
    ra.network,
    ra.nw_campaign_id as network_campaign_id,
    ra.network_campaign_name as name,
    ra.nw_tracked_visitors,
    ra.nw_kw_clicks,
    ra.nw_conversions,
    ra.revenue
  FROM
    revenue_aggregated ra
  INNER JOIN
    network_campaigns_user_relations ncur ON ra.nw_campaign_id = ncur.network_campaign_id
  WHERE
    ${mediaBuyer && !["admin", "unassigned"].includes(mediaBuyer) ? `ncur.user_id = ${mediaBuyer}` : "TRUE"}
    ${mediaBuyer && mediaBuyer == "unassigned" ? `
      AND ncur.network_campaign_id NOT IN (
        SELECT DISTINCT network_campaign_id
        FROM network_campaigns_user_relations ncur
        INNER JOIN users u ON u.id = ncur.user_id
        WHERE u.id != 3
      )
    ` : ""}
    ${network ? `AND ra.network = '${network}'` : ''}
  `
  const { rows } = await database.raw(query);
  return rows;
}

module.exports = networkCampaignData;
