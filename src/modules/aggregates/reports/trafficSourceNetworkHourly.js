const { buildConditionsInsights, buildSelectionColumns } = require('./utils');

async function trafficSourceNetworkHourly(database, startDate, endDate, mediaBuyer, adAccountIds) {

  const { mediaBuyerCondition, adAccountCondition } = buildConditionsInsights(mediaBuyer, adAccountIds);
  const query = `
  WITH hourly_data AS (
    SELECT
      TO_CHAR(timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles', 'YYYY-MM-DD') || ' ' || LPAD(DATE_PART('hour', timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles')::text, 2, '0') || ':00:00' AS hour_link,
      'TS: ' || traffic_source || ' - ' || 'NW: ' || network AS hour,
      ${buildSelectionColumns(prefix="", calculateSpendRevenue=true)}
    FROM
      analytics
    WHERE
      DATE(timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') > '${startDate}'
      AND DATE(timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') <= '${endDate}'
      ${mediaBuyerCondition}
      ${adAccountCondition}
    GROUP BY
      hour_link, traffic_source, network
    ORDER BY
      hour_link
  )
  SELECT
      hour_link AS hour,
      ${buildSelectionColumns(prefix="hd.", calculateSpendRevenue=true)},
      json_agg(hd.*) AS daily_data
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
