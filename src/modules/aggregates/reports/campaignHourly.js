const { buildSelectionColumns } = require('./utils');

async function campaignHourly(database, startDate, endDate, campaignId) {

  const network = await database.raw(`SELECT DISTINCT network FROM insights WHERE campaign_id = '${campaignId}'`);

  if (network.rows[0].network === 'sedo') {
    return [];
  }

  const query = `
    SELECT
      hour,
      ${buildSelectionColumns(prefix="", calculateSpendRevenue=true)}
    FROM insights
    WHERE date > '${startDate}' AND date <= '${endDate}'
    AND campaign_id = '${campaignId}'
    GROUP BY hour
    ORDER BY hour;
  `;
  const { rows } = await database.raw(query);
  return rows;
}

module.exports = campaignHourly;
