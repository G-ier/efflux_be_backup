
async function adAccountData(database, startDate, endDate, mediaBuyer, trafficSource) {

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
      ${mediaBuyer && !["admin", "unassigned"].includes(mediaBuyer) ? `uam.u_id = ${mediaBuyer}` : "TRUE"}
      ${mediaBuyer && mediaBuyer == "unassigned" ? `
        AND sa.ad_account_id NOT IN (
          SELECT DISTINCT aa.provider_id
          FROM u_aa_map map
          INNER JOIN ad_accounts aa ON aa.id = map.aa_id
          INNER JOIN users u ON u.id = map.u_id
          WHERE u.id != 3
        )
      ` : ""}
      ${trafficSource ? `AND sa.traffic_source = '${trafficSource}'` : ''}
  `;
  const { rows } = await database.raw(query);
  return rows;
}

module.exports = adAccountData;
