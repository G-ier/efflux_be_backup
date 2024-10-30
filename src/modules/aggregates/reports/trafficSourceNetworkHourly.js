const { buildConditionsInsights, buildSelectionColumns } = require('./utils');

async function trafficSourceNetworkHourly(database, startDate, endDate, mediaBuyer, adAccountIds) {

  const { mediaBuyerCondition, adAccountCondition } = buildConditionsInsights(mediaBuyer, adAccountIds);
  const query = `
  WITH hourly_data AS (
    SELECT
      TO_CHAR(analytics.timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles', 'YYYY-MM-DD') || ' ' || LPAD(DATE_PART('hour', analytics.timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles')::text, 2, '0') || ':00:00' AS hour_link,
      'TS: ' || analytics.traffic_source || ' - ' || 'NW: ' || analytics.network AS hour,
      ${buildSelectionColumns(prefix="analytics.", calculateSpendRevenue=true)}
    FROM
      analytics
    LEFT JOIN excluded_ad_accounts ON analytics.ad_account_id = excluded_ad_accounts.ad_account_provider_id
    WHERE
      DATE(analytics.timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') > '${startDate}'
      AND DATE(analytics.timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') <= '${endDate}'
      ${mediaBuyerCondition}
      ${adAccountCondition}
    GROUP BY
      hour_link, analytics.traffic_source, analytics.network
    ORDER BY
      hour_link
  )
  SELECT
      hd.hour_link AS hour,
      ${buildSelectionColumns(prefix="hd.", calculateSpendRevenue=true)},
      json_agg(hd.*) AS subrows
  FROM
      hourly_data hd
  GROUP BY
      hd.hour_link
  ORDER BY
      hour;
  `;
  const { rows } = await database.raw(query);
  return rows;
}

module.exports = trafficSourceNetworkHourly;
