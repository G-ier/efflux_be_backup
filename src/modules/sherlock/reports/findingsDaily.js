const { buildSelectionColumns } = require('./utils');

async function campaignDaily(database, startDate, endDate, campaignId, orgId) {
  const orgQuery = orgId ? `AND org_id = '${orgId}'` : '';
  const query = `
    SELECT
      date,
      ${buildSelectionColumns((prefix = ''), (calculateSpendRevenue = true))}
    FROM insights
    WHERE date > '${startDate}' AND date <= '${endDate}'
    AND campaign_id = '${campaignId}'
    ${orgQuery}
    GROUP BY date
    ORDER BY date;
  `;
  const { rows } = await database.raw(query);
  return rows;
}

module.exports = campaignDaily;
