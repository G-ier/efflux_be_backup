function TRAFFIC_SOURCE(network, trafficSource ,startDate, endDate, campaignIdsRestriction) {
  if (trafficSource === 'facebook') {
    return `
      inpulse AS (
        SELECT
          fb.date as coefficient_date,
          CASE
            WHEN SUM(fb.total_spent) >= 0 AND SUM(fb.total_spent) < 1500 THEN 1.1
            WHEN SUM(fb.total_spent) >= 1500 AND SUM(fb.total_spent) < 3000 THEN 1.08
            WHEN SUM(fb.total_spent) >= 3000 AND SUM(fb.total_spent) < 6000 THEN 1.06
            WHEN SUM(fb.total_spent) >= 6000 AND SUM(fb.total_spent) < 10000 THEN 1.04
            ELSE 1.04
          END as coefficient
        FROM facebook fb
        INNER JOIN ad_accounts ad ON ad.fb_account_id::text = fb.ad_account_id
        WHERE  fb.date >  '${startDate}'
        AND  fb.date <= '${endDate}'
        AND (ad.name LIKE '%INPULSE%' OR ad.name LIKE '%CSUY%')
        GROUP BY fb.date
      ), traffic_source AS (
        SELECT
          fb.date as date,
          fb.hour as hour,
          fb.adset_id,
          MAX(fb.campaign_id) as campaign_id,
          MAX(inp.coefficient) as coefficient,
          MAX(ad.name) as ad_account_name,
          MAX(fb.updated_at) as ts_last_updated,
          CAST(ROUND(SUM(fb.total_spent)::decimal, 2) AS FLOAT) as spend,
          CAST(SUM(fb.clicks) AS INTEGER) as clicks,
          CAST(SUM(fb.link_clicks) AS INTEGER) as link_clicks,
          CAST(SUM(fb.conversions) AS INTEGER) as ts_conversions,
          CAST(SUM(fb.impressions) AS INTEGER) as impressions
        FROM facebook fb
        INNER JOIN campaigns c ON c.id = fb.campaign_id AND c.traffic_source = 'facebook'
        INNER JOIN ad_accounts ad ON ad.id = c.ad_account_id
        INNER JOIN inpulse inp ON inp.coefficient_date = fb.date
        WHERE fb.date > '${startDate}' AND fb.date <= '${endDate}'
        AND fb.campaign_id IN (SELECT campaign_id FROM restriction)
        ${campaignIdsRestriction ? `AND fb.campaign_id IN ${campaignIdsRestriction}` : ''}
        GROUP BY fb.date, fb.hour, fb.adset_id
      )
    `
  } else if (trafficSource === 'tiktok') {
    return `
      traffic_source AS (
        SELECT
          tt.date as date,
          tt.hour as hour,
          tt.adset_id,
          MAX(tt.campaign_id) as campaign_id,
          MAX(tt.updated_at) as ts_last_updated,
          CAST(ROUND(SUM(tt.total_spent)::decimal, 2) AS FLOAT) as spend,
          CAST(ROUND(SUM(tt.impressions)::decimal, 2) AS FLOAT) as impressions,
          CAST(ROUND(SUM(tt.clicks)::decimal, 2) AS FLOAT) as clicks,
          CAST(ROUND(SUM(tt.conversions)::decimal, 2) AS FLOAT) as ts_conversions
        FROM tiktok tt
        --INNER JOIN campaigns c ON c.id = tt.campaign_id AND c.traffic_source = 'tiktok'
        WHERE tt.date > '${startDate}' AND tt.date <= '${endDate}'
        AND tt.campaign_id IN (SELECT campaign_id FROM restriction)
        ${campaignIdsRestriction ? `AND tt.campaign_id IN ${campaignIdsRestriction}` : ''}
        GROUP BY tt.date, tt.hour, tt.adset_id
      )
    `
  }
  else if (trafficSource === 'taboola'){
    return `traffic_source AS (
    SELECT tbl.date,
    tbl.hour,
    tbl.campaign_id as campaign_id,
    CAST(ROUND(SUM(tbl.spent)::decimal, 2) AS FLOAT) as spend,
    CAST(ROUND(SUM(tbl.impressions)::decimal, 2) AS FLOAT) as impressions,
    CAST(ROUND(SUM(tbl.clicks)::decimal, 2) AS FLOAT) as clicks,
    CAST(ROUND(SUM(tbl.cpa_actions_num)::decimal, 2) AS FLOAT) as ts_conversions,
    MAX(tbl.updated_at) as ts_last_updated,
    null as adset_id
    FROM taboola tbl
    WHERE tbl.campaign_id IN (SELECT campaign_id FROM restriction)
    ${campaignIdsRestriction ? `AND tt.campaign_id IN ${campaignIdsRestriction}` : ''}
    GROUP BY tbl.date, tbl.hour, tbl.campaign_id
    )`
  }
  else {
    throw new Error('Invalid traffic source')
  }
}

function NETWORK(network, trafficSource, startDate, endDate, campaignIdsRestriction) {
  if (network === 'crossroads') {
    return `
      network AS (
        SELECT
          cr.hour as hour,
          cr.request_date as date,
          ${
            trafficSource === 'taboola' ? `MAX(cr.adset_id) as adset_id,
            cr.campaign_id as campaign_id `:
             `cr.adset_id,
              MAX(cr.campaign_id) as campaign_id`
          },
          CAST(ROUND(SUM(cr.total_revenue)::decimal, 2) AS FLOAT) as revenue,
          CAST(SUM(cr.total_searches) AS INTEGER) as searches,
          CAST(SUM(cr.total_lander_visits) AS INTEGER) as lander_visits,
          CAST(SUM(cr.total_revenue_clicks) AS INTEGER) as cr_conversions,
          MAX(cr.updated_at) as network_updated_at,
          CAST(SUM(cr.total_visitors) AS INTEGER) as visitors,
          0 as uniq_conversions,
          CAST(SUM(cr.total_tracked_visitors) AS INTEGER) as tracked_visitors
        FROM crossroads cr
        WHERE cr.request_date > '${startDate}'
        AND   cr.request_date <= '${endDate}'
        AND   cr.traffic_source = '${trafficSource}'
        ${campaignIdsRestriction ? `AND cr.campaign_id IN ${campaignIdsRestriction}` : ''}
        GROUP BY cr.request_date, cr.hour, cr.adset_id,  ${
          trafficSource === 'taboola' ? `cr.campaign_id`: `cr.adset_id`
        }
      )
    `
  } else if (network === 'sedo') {
    return `
      network AS (
        SELECT
          sedo.hour as hour,
          sedo.date as date,
          sedo.adset_id,
          MAX(sedo.campaign_id) as campaign_id,
          CAST(SUM(sedo.visitors) AS INTEGER) as lander_visits,
          CAST(SUM(sedo.visitors) AS INTEGER) as tracked_visitors,
          CAST(SUM(sedo.visitors) AS INTEGER) as visitors,
          CAST(SUM(sedo.pb_visits) AS INTEGER) as pb_lander_conversions,
          0 as searches,
          CAST(SUM(sedo.pb_conversions) AS INTEGER) as pb_conversions,
          CAST(SUM(sedo.conversions) AS INTEGER) as cr_conversions,
          0 as uniq_conversions,
          CAST(ROUND(SUM(sedo.pb_revenue)::decimal, 2) AS FLOAT) as pb_revenue,
          CAST(ROUND(SUM(sedo.revenue)::decimal, 2) AS FLOAT) as revenue,
          MAX(sedo.updated_at) as network_updated_at
        FROM sedo sedo
              WHERE sedo.date > '${startDate}'
              AND   sedo.date <= '${endDate}'
              AND   sedo.traffic_source = '${trafficSource}'
              ${campaignIdsRestriction ? `AND sedo.campaign_id IN ${campaignIdsRestriction}` : ''}
        GROUP BY sedo.date, sedo.hour, sedo.adset_id
      )
    `
  } else if (network === 'tonic') {
    return `
    network AS (
      SELECT
        tonic.hour as hour,
        tonic.date as date,
        tonic.adset_id,
        MAX(tonic.campaign_id) as campaign_id,
        SUM(tonic.revenue) as revenue,
        0 AS searches,
        0 AS lander_visits,
        SUM(tonic.conversions) AS cr_conversions,
        MAX(tonic.updated_at) as network_updated_at,
        0 AS visitors,
        0 AS uniq_conversions,
        0 AS tracked_visitors
      FROM tonic tonic
      WHERE tonic.date > '${startDate}'
      AND   tonic.date <= '${endDate}'
      AND   tonic.traffic_source = '${trafficSource}'
      ${campaignIdsRestriction ? `AND tonic.campaign_id IN ${campaignIdsRestriction}` : ''}
      GROUP BY tonic.date, tonic.hour, tonic.adset_id
    )
    `
  }
  else if (network === 'medianet') {
    return `
    network AS (
      SELECT
        medianet.hour as hour,
        medianet.date as date,
        medianet.adset_id,
        MAX(medianet.campaign_id) as campaign_id,
        SUM(medianet.revenue) as revenue,
        0 AS searches,
        0 AS lander_visits,
        SUM(medianet.conversions) AS cr_conversions,
        MAX(medianet.updated_at) as network_updated_at,
        0 as pb_lander_conversions,
        0 as pb_conversions,
        0 AS visitors,
        0 AS uniq_conversions,
        0 AS tracked_visitors
      FROM medianet
      WHERE medianet.date > '${startDate}'
      AND   medianet.date <= '${endDate}'
      AND   medianet.traffic_source = '${trafficSource}'
      ${campaignIdsRestriction ? `AND medianet.campaign_id IN ${campaignIdsRestriction}` : ''}
      GROUP BY medianet.date, medianet.hour, medianet.adset_id
    )
    `
  }
  else {
    throw new Error('Invalid network')
  }
}

function POSTBACKS(network, trafficSource, startDate, endDate, campaignIdsRestriction) {
  if (network === 'crossroads' || network === 'tonic') {
    return `
    , postback_events AS (
      SELECT
        pb.date as date,
        pb.hour as hour,
        pb.adset_id,
        MAX(pb.campaign_id) as campaign_id,
        CAST(COUNT(CASE WHEN pb.event_type = 'PageView' THEN 1 ELSE null END) AS INTEGER) as pb_lander_conversions,
        CAST(COUNT(CASE WHEN pb.event_type = 'ViewContent' THEN 1 ELSE null END) AS INTEGER) as pb_serp_conversions,
        CAST(COUNT(CASE WHEN pb.event_type = 'Purchase' THEN 1 ELSE null END) AS INTEGER) as pb_conversions
      FROM postback_events pb
      WHERE pb.date > '${startDate}' AND pb.date <= '${endDate}' AND pb.traffic_source = '${trafficSource}' AND pb.network = '${network}'
      ${campaignIdsRestriction ? `AND pb.campaign_id IN ${campaignIdsRestriction}` : ''}
      GROUP BY pb.date, pb.hour, pb.adset_id
    )`
  }
  else if (network === 'sedo' || network === 'medianet') {
    return ``
  }
  else {
    throw new Error('Invalid network')
  }
}

function RETURN_FIELDS(network, traffic_source) {

  const spendPlusFee = (trafficSource) => {

    const spend_plus_fee = `
      CAST (
        ROUND(
            CASE
                  WHEN traffic_source.ad_account_name LIKE '%Nitido%' THEN traffic_source.spend * 1.02
                  WHEN traffic_source.ad_account_name LIKE '%Rebate%' THEN traffic_source.spend * 1.03
                  WHEN traffic_source.ad_account_name LIKE '%INPULSE%' OR traffic_source.ad_account_name LIKE '%CSUY%' THEN traffic_source.spend * traffic_source.coefficient
                  ELSE traffic_source.spend
            END::decimal, 2
            ) AS FLOAT
      )
    `
    if (trafficSource === 'facebook') {
      return `

        CASE WHEN network.date IS NULL THEN
        ${spend_plus_fee}
        ELSE 0 END as unallocated_spend_plus_fee,

        CASE WHEN network.date IS NOT NULL THEN
        ${spend_plus_fee}
        ELSE 0 END as spend_plus_fee

      `
    }
    else if (trafficSource === 'tiktok') {
      return `
      CASE WHEN network.date IS NULL THEN
      traffic_source.spend
      ELSE 0 END as unallocated_spend_plus_fee,

      CASE WHEN network.date IS NOT NULL THEN
      traffic_source.spend
      ELSE 0 END as spend_plus_fee
      `
    }
    else if (trafficSource === 'taboola'){
      return `
      CASE WHEN network.date IS NULL THEN traffic_source.spend
      ELSE 0 END as unallocated_spend_plus_fee,
      CASE WHEN network.date IS NOT NULL THEN
      traffic_source.spend
      ELSE 0 END as spend_plus_fee
      `
    }
    else {
      throw new Error('Invalid traffic source')
    }
  }

  return `

    CASE WHEN network.date IS NULL THEN traffic_source.spend ELSE 0 END as unallocated_spend,
    CASE WHEN network.date IS NOT NULL THEN traffic_source.spend ELSE 0 END as spend,

    CASE WHEN traffic_source.date IS NULL THEN network.revenue ELSE 0 END as unallocated_revenue,
    CASE WHEN traffic_source.date IS NOT NULL THEN network.revenue ELSE 0 END as revenue,

    traffic_source.ts_conversions as ts_conversions,
    traffic_source.clicks as ts_clicks,
    traffic_source.ts_last_updated as ts_updated_at,
    network.network_updated_at as network_updated_at,
    network.cr_conversions as nw_conversions,
    network.uniq_conversions as nw_uniq_conversions,
    ${
      network === 'crossroads' || network === 'tonic' ? `
        postback_events.pb_lander_conversions as pb_lander_conversions,
        postback_events.pb_serp_conversions as pb_serp_conversions,
        postback_events.pb_conversions as pb_conversions,
      `:
      network === 'sedo' || network === 'medianet' ? `
        network.pb_lander_conversions as pb_lander_conversions,
        0 as pb_serp_conversions,
        network.pb_conversions as pb_conversions,
      `: ``
    }
    network.searches as searches,
    network.lander_visits as lander_visits,
    network.visitors as visitors,
    network.tracked_visitors as tracked_visitors,
    ${traffic_source === 'facebook' ? 'traffic_source.link_clicks' : '0'} as link_clicks,
    traffic_source.impressions as impressions,
    ${traffic_source === 'facebook' ? 'traffic_source.ad_account_name as ad_account_name,' : ''}
    ${spendPlusFee(traffic_source)}
  `
}

async function compileAggregates(database, network, trafficSource, startDate, endDate, campaignIdsRestriction=null) {
  const query = `
    WITH restriction AS (
      SELECT DISTINCT campaign_id, adset_id
        FROM ${network}
      WHERE
        date > '${startDate}' AND date <= '${endDate}'
      AND traffic_source = '${trafficSource}'
    ), ${ trafficSource != 'taboola' ? `agg_adsets_data AS (
      SELECT
        c.id as campaign_id,
        MAX(c.name) as campaign_name,
        adsets.provider_id as adset_id,
        MAX(adsets.name) as adset_name,
        adsets.ad_account_id as ad_account_id
      FROM adsets
        JOIN campaigns c ON c.id = adsets.campaign_id AND c.traffic_source = '${trafficSource}'
        ${campaignIdsRestriction ? `WHERE c.id IN ${campaignIdsRestriction}` : ''}
      GROUP BY c.id, adsets.provider_id, adsets.ad_account_id
    )` :
    `agg_adsets_data AS (
      SELECT
      id as campaign_id,
      MAX(name) as campaign_name,
      '' as adset_id,
      '' as adset_name,
      ad_account_id
      FROM campaigns
      ${campaignIdsRestriction ? `WHERE id IN ${campaignIdsRestriction}` : ''}
      GROUP BY id, ad_account_id
    )`
  }
    , ${TRAFFIC_SOURCE(network, trafficSource, startDate, endDate, campaignIdsRestriction)}
    , ${NETWORK(network, trafficSource, startDate, endDate, campaignIdsRestriction)}
      ${POSTBACKS(network, trafficSource, startDate, endDate, campaignIdsRestriction)}
    SELECT
      COALESCE(traffic_source.date, network.date) as date,
      COALESCE(traffic_source.hour, network.hour) as hour,
      COALESCE(agg_adsets_data.campaign_id, traffic_source.campaign_id, network.campaign_id) as campaign_id,
      agg_adsets_data.campaign_name as campaign_name,
      COALESCE(agg_adsets_data.adset_id, network.adset_id, traffic_source.adset_id ${network === 'sedo' || network === 'medianet' ? '' : ', postback_events.adset_id'}) as adset_id,
      agg_adsets_data.adset_name as adset_name,
      agg_adsets_data.ad_account_id as ad_account_id,
      ${RETURN_FIELDS(network, trafficSource)}
    FROM network
    FULL OUTER JOIN traffic_source ON
    ${
      trafficSource === 'taboola' ? `traffic_source.campaign_id = network.campaign_id`: ` traffic_source.adset_id = network.adset_id`
    }
    AND traffic_source.date = network.date AND network.hour = traffic_source.hour
    FULL OUTER JOIN agg_adsets_data ON ${
      trafficSource === 'taboola' ? `traffic_source.campaign_id = agg_adsets_data.campaign_id` : `traffic_source.adset_id = agg_adsets_data.adset_id`
    }
    ${
      network === 'crossroads' || network === 'tonic' ? `
        FULL OUTER JOIN postback_events ON network.adset_id = postback_events.adset_id AND network.date = postback_events.date AND network.hour = postback_events.hour
      `: ``
    }
    WHERE COALESCE(traffic_source.date, network.date) > '${startDate}' AND COALESCE(traffic_source.date, network.date) <= '${endDate}';
  `
  const { rows } = await database.raw(query)
  return rows
}

module.exports = compileAggregates;
