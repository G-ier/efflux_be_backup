const { buildConditionsInsights, buildSelectionColumns } = require('./utils');

async function trafficSourceNetworkDaily(database, startDate, endDate, mediaBuyer, adAccountId) {
  const { mediaBuyerCondition, adAccountCondition } = buildConditionsInsights(mediaBuyer, adAccountId);
  const query = `
    WITH daily_data AS (
      SELECT
        DATE(analytics.timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') AS timeframe,
        'TS: ' || analytics.traffic_source || ' - ' || 'NW: ' || analytics.network AS date,
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
        DATE(analytics.timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles'), analytics.traffic_source, analytics.network
      ORDER BY
        DATE(analytics.timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles')
    )
    SELECT
        TO_CHAR(DATE(dd.timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles'), 'YYYY-MM-DD') AS date,
        ${buildSelectionColumns(prefix="dd.", calculateSpendRevenue=true)},
        json_agg(dd.*) AS subrows
    FROM
        daily_data dd
    GROUP BY
        DATE(dd.timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles');
  `;

  const { rows } = await database.raw(query);
  return rows;
}

module.exports = trafficSourceNetworkDaily;
