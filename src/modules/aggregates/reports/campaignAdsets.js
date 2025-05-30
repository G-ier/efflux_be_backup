const { buildSelectionColumns } = require('./utils');

async function campaignAdsets(database, startDate, endDate, campaignId, orgId) {
  const orgIdFilter = orgId ? `AND org_id = '${orgId}'` : '';
  const query = `
    SELECT
      adset_id,
      adset_name,
      ${buildSelectionColumns(prefix="", calculateSpendRevenue=true)}
    FROM insights
    WHERE date > '${startDate}' AND date <= '${endDate}'
    AND campaign_id = '${campaignId}'
    ${orgIdFilter}
    GROUP BY adset_id, adset_name
    ORDER BY SUM(revenue) DESC;
  `;
  const { rows } = await database.raw(query);
  return rows;
}

module.exports = campaignAdsets;
