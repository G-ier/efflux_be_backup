const { buildSelectionColumns, castSum } = require("./utils");

async function adsetsByCampaignId(database, startDate, endDate, campaignIds=[]) {

    const campaignIdCondition = campaignIds.length ? `AND insights.campaign_id IN (${campaignIds.map(id => `'${id}'`).join(', ')})` : "";

  const query = `
    SELECT
      insights.campaign_id,
      insights.adset_id,
      MAX(campaign_name) as campaign_name,
      MAX(adsets.status) as status,
      CAST(COALESCE(MAX(adsets.daily_budget), '0') AS FLOAT) as daily_budget,
      MAX(insights.adset_name) as adset_name,
      ${castSum(`nw_uniq_conversions`)} as nw_uniq_conversions,
      ${buildSelectionColumns("", calculateSpendRevenue=true)}
    FROM insights
    JOIN adsets ON insights.adset_id = adsets.provider_id
    WHERE date > '${startDate}' AND date <= '${endDate}' 
      ${campaignIdCondition}
    GROUP BY insights.campaign_id, insights.adset_id;
  `;

  const { rows } = await database.raw(query);
  return rows;
}

module.exports = adsetsByCampaignId;
