
async function networkCampaignData(database, startDate, endDate, mediaBuyer, assignment, network) {



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
  ${
    mediaBuyer !== "admin" && mediaBuyer ? `JOIN network_campaigns_user_relations ncur ON ra.nw_campaign_id = ncur.network_campaign_id` : ''
  }
  ${
    mediaBuyer == "admin" && mediaBuyer && assignment == "unassigned" ? `JOIN network_campaigns_user_relations ncur ON ra.nw_campaign_id = ncur.network_campaign_id` : ''
  }
  WHERE
    ${mediaBuyer !== "admin" && mediaBuyer ? `ncur.user_id = ${mediaBuyer}` : "TRUE"}
    ${mediaBuyer == "admin" && mediaBuyer && assignment == "unassigned" ? `AND ncur.user_id = 3` : (mediaBuyer == "admin" || !mediaBuyer ? "AND TRUE" : "TRUE")}
    ${mediaBuyer == "admin" && mediaBuyer && assignment == "unassigned" ? `AND NOT EXISTS (
      SELECT 1
      FROM network_campaigns_user_relations ncur2
      WHERE ncur2.network_campaign_id = ra.nw_campaign_id
      AND ncur2.user_id != 3
    )`: 'AND TRUE'}
    ${network ? `AND ra.network = '${network}'` : ''}
  `

  const { rows } = await database.raw(query);
  return rows;
}

module.exports = networkCampaignData;
