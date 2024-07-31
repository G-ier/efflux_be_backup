const { buildSelectionColumns } = require('./utils');

async function campaignHourly(database, startDate, endDate, campaignId, orgId) {

  const query = `
    SELECT
      TO_CHAR(timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles', 'YYYY-MM-DD') || ' ' || LPAD(DATE_PART('hour', timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles')::text, 2, '0') || ':00:00' AS hour,
      ${buildSelectionColumns(prefix="", calculateSpendRevenue=true)}
    FROM
      analytics
    WHERE
      DATE(timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') > '${startDate}'
      AND DATE(timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') <= '${endDate}'
      AND campaign_id = '${campaignId}'
    GROUP BY
      hour
    ORDER BY
      hour;
  `;
  const { rows } = await database.raw(query);
  return rows;
}

module.exports = campaignHourly;
