const { buildConditionsInsights, buildSelectionColumns } = require('./utils');

async function trafficSourceNetworkCampaignsStats(database, startDate, endDate, network = 'crossroads', trafficSource, mediaBuyer, adAccountId, q, orgId) {

  const { mediaBuyerCondition, adAccountCondition, queryCondition, orgIdCondition} = buildConditionsInsights(mediaBuyer, adAccountId, q, orgId);
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
      ${orgIdCondition}
    GROUP BY campaign_id, campaign_name
    ORDER BY SUM(revenue) DESC;
  `;
  const { rows } = await database.raw(query);
  return rows;
}

module.exports = trafficSourceNetworkCampaignsStats;
