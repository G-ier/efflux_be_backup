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
  ${castSum(`${prefix}nw_tracked_visitors`)} as nw_tracked_visitors,
  ${castSum(`${prefix}nw_kw_clicks`)} as nw_kw_clicks,
  ${castSum(`${prefix}nw_conversions`)} as nw_conversions,

  ${castSum(`${prefix}ts_impressions`)} as ts_impressions,
  ${castSum(`${prefix}ts_link_clicks`)} as ts_link_clicks,
  ${castSum(`${prefix}ts_conversions`)} as ts_conversions,

  0 as pb_conversions
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

  // Alter mediaBuyerCondition for new 'unassigned' case here
  let mediaBuyerCondition = "";
  if(mediaBuyer && !["admin", "unassigned"].includes(mediaBuyer)){
    mediaBuyerCondition = `AND ( analytics.ad_account_id IN (
      SELECT
        aa.provider_id
      FROM
        u_aa_map map
      INNER JOIN
        ad_accounts aa ON aa.id = map.aa_id
      WHERE
        map.u_id = ${mediaBuyer}
    ) OR analytics.nw_campaign_id IN (
      SELECT
        network_campaign_id
      FROM
        network_campaigns_user_relations
      WHERE
        user_id = ${mediaBuyer}
    ))`;
  } else if(mediaBuyer && mediaBuyer == "unassigned"){
    mediaBuyerCondition = `
    AND (
      (
        analytics.ad_account_id NOT IN (
          SELECT DISTINCT aa.provider_id
          FROM u_aa_map map
          INNER JOIN ad_accounts aa ON aa.id = map.aa_id
          INNER JOIN users u ON u.id = map.u_id
          WHERE u.id != 3
        )
      )
      OR
      (
        analytics.nw_campaign_id NOT IN (
          SELECT DISTINCT network_campaign_id
          FROM network_campaigns_user_relations ncur
          INNER JOIN users u ON u.id = ncur.user_id
          WHERE u.id != 3
        )
      )
    )`;
  }

  return {
    mediaBuyerCondition: mediaBuyerCondition,
    adAccountCondition: adAccountCondition
  };
}

module.exports = {
  castSum,
  buildSelectionColumns,
  buildConditionsInsights
};

