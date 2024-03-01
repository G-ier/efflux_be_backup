const { buildConditionsInsights, buildSelectionColumns } = require('./utils');

async function trafficSourceNetworkDaily(database, startDate, endDate, network = 'crossroads', trafficSource, mediaBuyer, adAccountId, q, orgId) {
  const { mediaBuyerCondition, adAccountCondition, queryCondition, orgIdCondition } = buildConditionsInsights(mediaBuyer, adAccountId, q, orgId);
  // TODO: add ${orgIdCondition} in the next PR
  const query = `
    SELECT
      date,
      ${buildSelectionColumns(prefix="", calculateSpendRevenue=true)}
    FROM insights
    WHERE date > '${startDate}' AND date <= '${endDate}' AND traffic_source = '${trafficSource}' AND network = '${network}'
      ${mediaBuyerCondition}
      ${adAccountCondition}
      ${queryCondition}
    GROUP BY date
    ORDER BY date;
  `;
  const { rows } = await database.raw(query);
  return rows;
}

module.exports = trafficSourceNetworkDaily;
