
async function networkCampaignData(database, startDate, endDate, mediaBuyer, network) {


  const query = `
  WITH revenue_aggregated AS (
    SELECT
      MAX(r.network) AS network,
      r.nw_campaign_id,
      MAX(r.nw_campaign_name) AS network_campaign_name,
      CAST(SUM(r.nw_tracked_visitors) AS FLOAT) AS tracked_visitors,
      CAST(SUM(r.nw_kw_clicks) AS FLOAT) AS keyword_clicks,
      CAST(SUM(r.nw_conversions) AS FLOAT) AS nw_conversions,
      CAST(SUM(r.revenue) AS FLOAT) AS revenue
    FROM
      analytics r
    WHERE
      DATE(r.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') > '${startDate}'
      AND DATE(r.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') <= '${endDate}'
    GROUP BY
      r.nw_campaign_id
  )
  SELECT DISTINCT
    ra.network,
    ra.nw_campaign_id as network_campaign_id,
    ra.network_campaign_name as name,
    ra.tracked_visitors,
    ra.keyword_clicks,
    ra.nw_conversions,
    ra.revenue
  FROM
    revenue_aggregated ra
  ${
    mediaBuyer !== "admin" && mediaBuyer ? `JOIN network_campaigns_user_relations ncur ON ra.network_campaign_id = ncur.network_campaign_id` : ''
  }
  WHERE
    ${mediaBuyer !== "admin" && mediaBuyer ? `ncur.user_id = ${mediaBuyer}` : "TRUE"}
    ${network ? `AND ra.network = '${network}'` : ''}
  `

  const { rows } = await database.raw(query);
  return rows;
}

module.exports = networkCampaignData;
