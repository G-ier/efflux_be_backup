const { buildConditionsInsights, buildSelectionColumns } = require('./utils');

async function trafficSourceNetworkDaily(database, startDate, endDate, mediaBuyer, assignment, adAccountId) {
  const { mediaBuyerCondition, adAccountCondition } = buildConditionsInsights(mediaBuyer, adAccountId, assignment);
  const query = `
    WITH daily_data AS (
      SELECT
        DATE(timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') AS timeframe,
        'TS: ' || traffic_source || ' - ' || 'NW: ' || network AS adset_name,
        ${buildSelectionColumns(prefix="", calculateSpendRevenue=true)}
      FROM
        analytics
      WHERE
        DATE(timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') > '${startDate}'
        AND DATE(timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') <= '${endDate}'
        ${mediaBuyerCondition}
        ${adAccountCondition}
      GROUP BY
        DATE(timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles'), traffic_source, network
      ORDER BY
        DATE(timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles')
    )
    SELECT
        TO_CHAR(DATE(dd.timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles'), 'YYYY-MM-DD') AS adset_name,
        ${buildSelectionColumns(prefix="dd.", calculateSpendRevenue=true)},
        json_agg(dd.*) AS adsets
    FROM
        daily_data dd
    GROUP BY
        DATE(dd.timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles');
  `;
  const { rows } = await database.raw(query);
  return rows;
}

module.exports = trafficSourceNetworkDaily;
