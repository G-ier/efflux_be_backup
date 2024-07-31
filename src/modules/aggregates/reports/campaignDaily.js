const { buildSelectionColumns } = require('./utils');

async function campaignDaily(database, startDate, endDate, campaignId, orgId) {

  const query = `
    SELECT
      TO_CHAR(DATE(timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles'), 'YYYY-MM-DD') AS date,
      ${buildSelectionColumns(prefix="", calculateSpendRevenue=true)}
    FROM
      analytics
    WHERE
      DATE(timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') > '${startDate}'
      AND DATE(timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') <= '${endDate}'
      AND campaign_id = '${campaignId}'
    GROUP BY
      date
    ORDER BY
      date;
  `;
  const { rows } = await database.raw(query);
  return rows;
}

module.exports = campaignDaily;
