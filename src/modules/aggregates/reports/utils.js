const { yesterdayYMD, dayBeforeYesterdayYMD } = require("../../../shared/helpers/calendar");

function castSum(column, type = "INTEGER") {
  return `CAST(SUM(${column}) AS ${type})`;
}

function buildSelectionColumns(prefix = "", calculateSpendRevenue = false) {
  return `
  ${
    calculateSpendRevenue ? `
      ${castSum("spend", type = "FLOAT")} + ${castSum("unallocated_spend", type = "FLOAT")} as spend,
      ${castSum("spend_plus_fee", type = "FLOAT")} + ${castSum("unallocated_spend_plus_fee", type = "FLOAT")} as spend_plus_fee,
      ${castSum("revenue", type = "FLOAT")} + ${castSum("unallocated_revenue", type = "FLOAT")} as revenue,
    ` : ``
  }
  ${castSum(`${prefix}searches`)} as searches,
  ${castSum(`${prefix}nw_conversions`)} as nw_conversions,
  ${castSum(`${prefix}ts_conversions`)} as ts_conversions,
  ${castSum(`${prefix}visitors`)} as visitors,
  ${castSum(`${prefix}tracked_visitors`)} as tracked_visitors,
  ${castSum(`${prefix}link_clicks`)} as link_clicks,
  ${castSum(`${prefix}impressions`)} as impressions,
  ${castSum(`${prefix}pb_conversions`)} as pb_conversions,
  ${castSum(`${prefix}nw_uniq_conversions`)} as uniq_conversions,
  0 as cost_per_purchase,
  0 as cost_per_lead,
  0 as cost_per_complete_payment,
  0 as traffic_source_cost_per_result
  `;
}

function buildConditionsInsights(mediaBuyer, adAccountIds, q) {
  let adAccountCondition;

  if (Array.isArray(adAccountIds)) {
    adAccountCondition = `AND insights.ad_account_id IN (${adAccountIds.join(",")})`;
  } else if (adAccountIds) {
    adAccountCondition = `AND insights.ad_account_id = ${adAccountIds}`
  } else {
    adAccountCondition = "";
  }

  return {
    mediaBuyerCondition: mediaBuyer !== "admin" && mediaBuyer ? `AND insights.user_id = ${mediaBuyer}` : "",
    adAccountCondition: adAccountCondition,
    queryCondition: q ? `AND insights.campaign_name LIKE '%${q}%'` : "",
  };
}


module.exports = {
  castSum,
  buildSelectionColumns,
  buildConditionsInsights
};
