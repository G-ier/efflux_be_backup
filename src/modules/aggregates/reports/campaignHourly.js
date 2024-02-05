const { buildSelectionColumns } = require('./utils');

async function campaignHourly(database, startDate, endDate, campaignId, orgId) {
  const orgQuery = orgId ? `AND org_id = '${orgId}'` : '';
  const query = `
    SELECT
      hour,
      ${buildSelectionColumns(prefix="", calculateSpendRevenue=true)}
    FROM insights
    WHERE date > '${startDate}' AND date <= '${endDate}'
    AND campaign_id = '${campaignId}'
    ${orgQuery}
    GROUP BY hour
    ORDER BY hour;
  `;
  const { rows } = await database.raw(query);
  return rows;
}

module.exports = campaignHourly;
