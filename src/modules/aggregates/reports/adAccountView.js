
async function adAccountData(database, startDate, endDate, mediaBuyer, trafficSource) {


  const query = `
      WITH spend_aggregated AS (
        SELECT
          s.ad_account_id,
          s.ad_account_name,
          s.traffic_source,
          CAST(SUM(s.spend) AS FLOAT) as spend,
          CAST(SUM(s.spend_plus_fee) AS FLOAT) as spend_plus_fee,
          CAST(SUM(s.impressions) AS INTEGER) as impressions,
          CAST(SUM(s.link_clicks) AS INTEGER) as link_clicks,
          CAST(SUM(s.ts_conversions) AS INTEGER) as ts_conversions
        FROM
          spend s
        WHERE
          DATE(s.occurred_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') > '${startDate}'
          AND DATE(s.occurred_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') <= '${endDate}'
        GROUP BY
          s.ad_account_id, s.ad_account_name, s.traffic_source
      )
      SELECT DISTINCT
        sa.ad_account_id,
        sa.ad_account_name as name,
        sa.traffic_source,
        sa.spend,
        sa.spend_plus_fee,
        sa.impressions,
        sa.link_clicks,
        sa.ts_conversions
      FROM
        spend_aggregated sa
      JOIN
        ad_accounts adc ON sa.ad_account_id::text = adc.provider_id
      JOIN
        u_aa_map uam ON adc.id = uam.aa_id
      WHERE
        ${mediaBuyer !== "admin" && mediaBuyer ? `uam.u_id = ${mediaBuyer}` : "TRUE"}
        ${trafficSource ? `AND sa.traffic_source = '${trafficSource}'` : ''}
    `;

  const { rows } = await database.raw(query);
  return rows;
}

module.exports = adAccountData;
