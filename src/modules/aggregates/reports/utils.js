function castSum(column, type = "INTEGER") {
  return `CAST(SUM(${column}) AS ${type})`;
}

function buildSelectionColumns(prefix = "", calculateSpendRevenue = false) {
  return `
  ${
    calculateSpendRevenue ?
    ` ${castSum("spend", type = "FLOAT")} as spend,
      ${castSum("spend_plus_fee", type = "FLOAT")} as spend_plus_fee,
      ${castSum("revenue", type = "FLOAT")} as revenue,
    `
    :
    ``
  }
  ${castSum(`${prefix}nw_kw_clicks`)} as nw_kw_clicks,
  ${castSum(`${prefix}nw_conversions`)} as nw_conversions,
  ${castSum(`${prefix}ts_conversions`)} as ts_conversions,
  ${castSum(`${prefix}nw_tracked_visitors`)} as nw_visitors,
  ${castSum(`${prefix}nw_tracked_visitors`)} as nw_tracked_visitors,
  ${castSum(`${prefix}ts_link_clicks`)} as ts_link_clicks,
  ${castSum(`${prefix}ts_impressions`)} as ts_impressions,
  0 as pb_conversions,
  0 as nw_uniq_conversions,
  0 as cost_per_purchase,
  0 as cost_per_lead,
  0 as cost_per_complete_payment,
  0 as traffic_source_cost_per_result
  `;
}

function buildConditionsInsights(mediaBuyer, adAccountIds) {
  let adAccountCondition;

  if (Array.isArray(adAccountIds)) {
    adAccountCondition = `AND analytics.ad_account_id IN (${adAccountIds.join(",")})`;
  } else if (adAccountIds) {
    adAccountCondition = `AND analytics.ad_account_id = ${adAccountIds}`
  } else {
    adAccountCondition = "";
  }
  return {
    mediaBuyerCondition: mediaBuyer !== "admin" && mediaBuyer ? `AND analytics.ad_account_id IN (
      SELECT
        aa.provider_id
      FROM
        u_aa_map map
      INNER JOIN
        ad_accounts aa ON aa.id = map.aa_id
      WHERE
        map.u_id = ${mediaBuyer}
    )
    ` : "",
    adAccountCondition: adAccountCondition
  };
}

module.exports = {
  castSum,
  buildSelectionColumns,
  buildConditionsInsights
};

