
async function adAccountData(database, startDate, endDate, mediaBuyer, assignment, trafficSource) {



  const query = `
      WITH spend_aggregated AS (
          SELECT
            a.ad_account_id,
            a.ad_account_name,
            a.traffic_source,
            CAST(SUM(a.spend) AS FLOAT) as spend,
            CAST(SUM(a.spend_plus_fee) AS FLOAT) as spend_plus_fee,
            CAST(SUM(a.ts_impressions) AS INTEGER) as ts_impressions,
            CAST(SUM(a.ts_link_clicks) AS INTEGER) as ts_link_clicks,
            CAST(SUM(a.ts_conversions) AS INTEGER) as ts_conversions
          FROM
            analytics a
          WHERE
            DATE(a.timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') > '${startDate}'
            AND DATE(a.timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') <= '${endDate}'
          GROUP BY
            a.ad_account_id, a.ad_account_name, a.traffic_source
      )
      SELECT DISTINCT
        sa.ad_account_id,
        sa.ad_account_name as name,
        sa.traffic_source,
        sa.spend,
        sa.spend_plus_fee,
        sa.ts_impressions,
        sa.ts_link_clicks,
        sa.ts_conversions
      FROM
        spend_aggregated sa
      JOIN
        ad_accounts adc ON sa.ad_account_id::text = adc.provider_id
      JOIN
        u_aa_map uam ON adc.id = uam.aa_id
      WHERE
        ${mediaBuyer !== "admin" && mediaBuyer ? `uam.u_id = ${mediaBuyer}` : "TRUE"}
        ${mediaBuyer == "admin" && mediaBuyer && assignment == "unassigned" ? `AND uam.u_id = 3` : (mediaBuyer == "admin" || !mediaBuyer ? "AND TRUE" : "TRUE")}
        ${mediaBuyer == "admin" && mediaBuyer && assignment == "unassigned" ? `AND NOT EXISTS (
          SELECT 1
          FROM u_aa_map uam2
          WHERE uam.aa_id = uam2.aa_id
          AND uam2.u_id != 3
        )`: 'AND TRUE'}
        ${trafficSource ? `AND sa.traffic_source = '${trafficSource}'` : ''}
    `;

  const { rows } = await database.raw(query);
  return rows;
}

module.exports = adAccountData;
