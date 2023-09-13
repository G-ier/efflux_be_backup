const { buildConditionsInsights, buildSelectionColumns } = require('./utils');

async function trafficSourceNetworkCampaignsStats(database, startDate, endDate, network = 'crossroads', trafficSource, mediaBuyer, adAccountId, q) {

  const { mediaBuyerCondition, adAccountCondition, queryCondition } = buildConditionsInsights(mediaBuyer, adAccountId, q);

  const query = `
    SELECT
      campaign_id,
      campaign_name,
      ${buildSelectionColumns(prefix="", calculateSpendRevenue=true)}
    FROM insights
    WHERE date > '${startDate}' AND date <= '${endDate}' AND traffic_source = '${trafficSource}' AND network = '${network}'
      ${mediaBuyerCondition}
      ${adAccountCondition}
      ${queryCondition}
    GROUP BY campaign_id, campaign_name
    ORDER BY SUM(revenue) DESC;
  `;
  const { rows } = await database.raw(query);
  return rows;
}

module.exports = trafficSourceNetworkCampaignsStats;
