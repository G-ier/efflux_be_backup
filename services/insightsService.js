const db              = require('../data/dbConfig');


// -------------------------------------------- QUERY ENGINE --------------------------------------------

function TRAFFIC_SOURCE(trafficSource ,startDate, endDate) {

  if (trafficSource === 'facebook') {
    return `
      traffic_source AS (
        SELECT
          fb.date as date,
          fb.hour as hour,
          fb.adset_id,
          MAX(ad.name) as ad_account_name,
          MAX(fb.updated_at) as last_updated,
          CAST(ROUND(SUM(fb.total_spent)::decimal, 2) AS FLOAT) as spend,
          CAST(SUM(fb.link_clicks) AS INTEGER) as link_clicks,
          CAST(SUM(fb.conversions) AS INTEGER) as fb_conversions,
          CAST(SUM(fb.impressions) AS INTEGER) as impressions
        FROM facebook_partitioned fb
        INNER JOIN campaigns c ON c.id = fb.campaign_id AND c.traffic_source = 'facebook'
        INNER JOIN ad_accounts ad ON ad.id = c.ad_account_id
        WHERE fb.date > '${startDate}' AND fb.date <= '${endDate}'
        AND fb.campaign_id IN (SELECT campaign_id FROM restriction)
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
          MAX(tt.updated_at) as last_updated,
          CAST(ROUND(SUM(tt.total_spent)::decimal, 2) AS FLOAT) as spend,
          CAST(ROUND(SUM(tt.impressions)::decimal, 2) AS FLOAT) as impressions,
          CAST(ROUND(SUM(tt.clicks)::decimal, 2) AS FLOAT) as clicks,
          CAST(ROUND(SUM(tt.conversions)::decimal, 2) AS FLOAT) as conversions
        FROM tiktok tt
        INNER JOIN campaigns c ON c.id = tt.campaign_id AND c.traffic_source = 'tiktok'
        WHERE tt.date > '${startDate}' AND tt.date <= '${endDate}'
        AND tt.campaign_id IN (SELECT campaign_id FROM restriction)
        GROUP BY tt.date, tt.hour, tt.adset_id
      )
    `
  } else {
    throw new Error('Invalid traffic source')
  }

}

function NETWORK(network, trafficSource, startDate, endDate) {
  if (network === 'crossroads') {
    return `
      network AS (
        SELECT
          cr.hour as hour,
          cr.request_date as date,
          cr.adset_id,
          CAST(ROUND(SUM(cr.total_revenue)::decimal, 2) AS FLOAT) as revenue,
          CAST(SUM(cr.total_searches) AS INTEGER) as searches,
          CAST(SUM(cr.total_lander_visits) AS INTEGER) as lander_visits,
          CAST(SUM(cr.total_revenue_clicks) AS INTEGER) as cr_conversions,
          MAX(cr.updated_at) as last_updated,
          CAST(SUM(cr.total_visitors) AS INTEGER) as visitors,
          0 as uniq_conversions,
          CAST(SUM(cr.total_tracked_visitors) AS INTEGER) as tracked_visitors
        FROM crossroads_partitioned cr
        WHERE cr.request_date > '${startDate}'
        AND   cr.request_date <= '${endDate}'
        AND   cr.traffic_source = '${trafficSource}'
        GROUP BY cr.request_date, cr.hour, cr.adset_id
      )
    `
  } else {
    throw new Error('Invalid network')
  }
}

function RETURN_FIELDS(network, traffic_source) {

  const spendPlusFee = (trafficSource) => {
    if (trafficSource === 'facebook') {
      return `
        CAST (
          ROUND(
               CASE
                    WHEN traffic_source.ad_account_name LIKE '%Nitido%' THEN traffic_source.spend * 1.02
                    WHEN traffic_source.ad_account_name LIKE '%Rebate%' THEN traffic_source.spend * 1.03
                    WHEN traffic_source.ad_account_name LIKE '%INPULSE%' OR traffic_source.ad_account_name LIKE '%CSUY%' THEN traffic_source.spend * inp.coefficient
                    ELSE traffic_source.spend
               END::decimal, 2
              ) AS FLOAT
        ) as spend_plus_fee
      `
    }
    else if (trafficSource === 'tiktok') {
      return `traffic_source.spend as spend_plus_fee`
    }
    else {
      throw new Error('Invalid traffic source')
    }
  }

  if (traffic_source === 'facebook') {
    return `
      network.revenue as revenue,
      traffic_source.spend as spend,
      traffic_source.fb_conversions as fb_conversions,
      network.cr_conversions as cr_conversions,
      network.uniq_conversions as cr_uniq_conversions,
      postback_events.pb_conversions as pb_conversions,
      network.searches as searches,
      network.lander_visits as lander_visits,
      network.visitors as visitors,
      network.tracked_visitors as tracked_visitors,
      traffic_source.link_clicks as link_clicks,
      traffic_source.impressions as impressions,
      traffic_source.ad_account_name as ad_account_name,
      ${spendPlusFee(traffic_source)}
    `
  } else if (traffic_source === 'tiktok') {
    return `
      network.revenue as revenue,
      traffic_source.spend as spend,
      traffic_source.conversions as fb_conversions,
      network.cr_conversions as cr_conversions,
      network.uniq_conversions as cr_uniq_conversions,
      postback_events.pb_conversions as pb_conversions,
      network.searches as searches,
      network.lander_visits as lander_visits,
      network.visitors as visitors,
      0 as link_clicks,
      network.tracked_visitors as tracked_visitors,
      traffic_source.impressions as impressions,
      ${spendPlusFee(traffic_source)}
    `
  }
}

function ruleThemAllQuery(network, trafficSource, startDate, endDate) {

  const query = `
    WITH restriction AS (
      SELECT DISTINCT campaign_id, adset_id
        FROM crossroads_partitioned
      WHERE
        request_date > '${startDate}' AND request_date <= '${endDate}'
      AND traffic_source = '${trafficSource}'
    ), inpulse AS (
      SELECT
        fb.date as coefficient_date,
        CASE
          WHEN SUM(fb.total_spent) >= 0 AND SUM(fb.total_spent) < 1500 THEN 1.1
          WHEN SUM(fb.total_spent) >= 1500 AND SUM(fb.total_spent) < 3000 THEN 1.08
          WHEN SUM(fb.total_spent) >= 3000 AND SUM(fb.total_spent) < 6000 THEN 1.06
          WHEN SUM(fb.total_spent) >= 6000 AND SUM(fb.total_spent) < 10000 THEN 1.04
          ELSE 1.04
        END as coefficient
      FROM facebook_partitioned fb
      INNER JOIN ad_accounts ad ON ad.fb_account_id = fb.ad_account_id
      WHERE  fb.date >  '${startDate}'
      AND  fb.date <= '${endDate}'
      AND (ad.name LIKE '%INPULSE%' OR ad.name LIKE '%CSUY%')
      GROUP BY fb.date
    ), agg_adsets_data AS (
      SELECT
        c.id as campaign_id,
        MAX(c.name) as campaign_name,
        adsets.provider_id as adset_id,
        MAX(adsets.name) as adset_name,
        adsets.user_id as user_id,
        adsets.ad_account_id as ad_account_id
      FROM adsets
        JOIN campaigns c ON c.id = adsets.campaign_id
      GROUP BY c.id, adsets.provider_id, adsets.user_id, adsets.ad_account_id
    )
    , ${TRAFFIC_SOURCE(trafficSource, startDate, endDate)}
    , ${NETWORK(network, trafficSource, startDate, endDate)}
    , postback_events AS (
      SELECT
        pb.date as date,
        pb.hour as hour,
        pb.adset_id,
        CAST(COUNT(CASE WHEN pb.event_type = 'PageView' THEN 1 ELSE null END) AS INTEGER) as pb_lander_conversions,
        CAST(COUNT(CASE WHEN pb.event_type = 'ViewContent' THEN 1 ELSE null END) AS INTEGER) as pb_serp_conversions,
        CAST(COUNT(CASE WHEN pb.event_type = 'Purchase' THEN 1 ELSE null END) AS INTEGER) as pb_conversions
      FROM postback_events_partitioned pb
      WHERE pb.date > '${startDate}' AND pb.date <= '${endDate}'
      GROUP BY pb.date, pb.hour, pb.adset_id
    )
    SELECT
      COALESCE(traffic_source.date, network.date, inp.coefficient_date) as date,
      COALESCE(traffic_source.hour, network.hour) as hour,
      agg_adsets_data.campaign_id as campaign_id,
      agg_adsets_data.campaign_name as campaign_name,
      COALESCE(agg_adsets_data.adset_id, network.adset_id, traffic_source.adset_id, postback_events.adset_id) as adset_id,
      agg_adsets_data.adset_name as adset_name,
      agg_adsets_data.user_id as user_id,
      agg_adsets_data.ad_account_id as ad_account_id,
      ${RETURN_FIELDS(network, trafficSource)}
    FROM network
    FULL OUTER JOIN traffic_source ON traffic_source.adset_id = network.adset_id AND traffic_source.date = network.date AND traffic_source.hour = network.hour
    FULL OUTER JOIN agg_adsets_data ON traffic_source.adset_id = agg_adsets_data.adset_id
    FULL OUTER JOIN postback_events ON network.adset_id = postback_events.adset_id AND network.date = postback_events.date AND network.hour = postback_events.hour
    JOIN inpulse inp ON inp.coefficient_date = ${trafficSource === 'facebook' ? 'network' : 'traffic_source'}.date;
  `
  const result = db.raw(query)
  return result
}

module.exports = {
  ruleThemAllQuery
}
