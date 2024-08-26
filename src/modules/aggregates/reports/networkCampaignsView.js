
async function networkCampaignData(database, startDate, endDate, mediaBuyer, network) {


  const query = `
  WITH revenue_aggregated AS (
    SELECT
      MAX(r.network) AS network,
      r.network_campaign_id AS network_campaign_id,
      MAX(r.network_campaign_name) AS network_campaign_name,
      SUM(r.landings) AS landings,
      SUM(r.keyword_clicks) AS keyword_clicks,
      SUM(r.conversions) AS conversions,
      SUM(r.revenue) AS revenue,
      CASE
          WHEN COUNT(DISTINCT final) = 1 AND MAX(final) IS NOT NULL THEN MAX(final)
          ELSE 'not_final'
      END AS final,
      MAX(r.account) AS account
    FROM
      revenue r
    WHERE
      DATE(r.occurred_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') > '${startDate}'
      AND DATE(r.occurred_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') <= '${endDate}'
      ${network ? `AND r.network = '${network}'` : ''}
    GROUP BY
      r.network_campaign_id
  )
  SELECT DISTINCT
    ra.network,
    ra.network_campaign_id,
    ra.network_campaign_name as name,
    ra.landings,
    ra.keyword_clicks,
    ra.conversions,
    ra.revenue,
    ra.final,
    ra.account

  FROM
    revenue_aggregated ra
  JOIN
    network_campaigns_user_relations ncur ON ra.network_campaign_id = ncur.network_campaign_id
  WHERE
    ${mediaBuyer !== "admin" && mediaBuyer ? `ncur.user_id = ${mediaBuyer}` : "TRUE"}
  `

  const { rows } = await database.raw(query);
  return rows;
}

module.exports = networkCampaignData;
