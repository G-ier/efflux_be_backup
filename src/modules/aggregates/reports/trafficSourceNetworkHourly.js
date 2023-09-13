const { buildConditionsInsights, buildSelectionColumns } = require('./utils');

async function trafficSourceNetworkHourly(database, startDate, endDate, network = 'crossroads', trafficSource, mediaBuyer, adAccountIds, q) {

  const { mediaBuyerCondition, adAccountCondition, queryCondition } = buildConditionsInsights(mediaBuyer, adAccountIds, q);

  const query = `
    SELECT
      hour,
      ${buildSelectionColumns(prefix="", calculateSpendRevenue=true)}
    FROM insights
    WHERE date > '${startDate}' AND date <= '${endDate}' AND traffic_source = '${trafficSource}' AND network = '${network}'
      ${mediaBuyerCondition}
      ${adAccountCondition}
      ${queryCondition}
    GROUP BY hour
    ORDER BY hour;
  `;
  const { rows } = await database.raw(query);
  return rows;
}

module.exports = trafficSourceNetworkHourly;
