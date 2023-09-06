const { buildSelectionColumns } = require('./utils');

async function campaignDaily(database, startDate, endDate, campaignId) {
  const query = `
    SELECT
      date,
      ${buildSelectionColumns(prefix="", calculateSpendRevenue=true)}
    FROM insights
    WHERE date > '${startDate}' AND date <= '${endDate}'
    AND campaign_id = '${campaignId}'
    GROUP BY date
    ORDER BY SUM(revenue) DESC;
  `;
  const { rows } = await database.raw(query);
  return rows;
}

module.exports = campaignDaily;
