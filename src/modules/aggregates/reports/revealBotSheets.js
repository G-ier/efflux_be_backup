const POSTBACKS = (entityGrouping, startDate, endDate, trafficSource, network) => {
  if (network === 'crossroads') {
    return `
      , live_postbacks AS (
        SELECT
          pb.${entityGrouping},
          CAST(COUNT(CASE WHEN pb.event_type = 'Purchase' THEN 1 ELSE null END) AS INTEGER) as pb_conversions,
          CAST(COUNT(CASE WHEN pb.event_type = 'PageView' THEN 1 ELSE null END) AS INTEGER) as pb_lander_conversions,
          CAST(COUNT(CASE WHEN pb.event_type = 'ViewContent' THEN 1 ELSE null END) AS INTEGER) as pb_serp_conversions
          FROM postback_events as pb
          WHERE pb.date >= '${startDate}' AND pb.date <= '${endDate}'
          AND pb.traffic_source = '${trafficSource}'
          GROUP BY pb.${entityGrouping}
    )
    `
  } else if (network === 'sedo') {
    return ``
  } else {
    throw new Error('Invalid network')
  }
}

async function revealBotSheets(database, startDate, endDate, aggregateBy="campaigns", trafficSource="facebook", network='crossroads') {

  if (aggregateBy === "campaigns") {
    entityGrouping = `campaign_id`
    selectString = `
      ins.campaign_id as campaign_id,
      MAX(ins.campaign_name) as entity_name,
      MAX(c.status) as status,
      MAX(CAST(COALESCE(c.daily_budget, '0') AS FLOAT)) as daily_budget,
      MAX(TO_CHAR(c.created_time::date, 'mm/dd/yy')) as launch_date,
    `
    joinString = `
      JOIN campaigns c ON c.id = ins.campaign_id
      JOIN ad_accounts ad ON ad.id = c.ad_account_id
    `
    groupBy = `ins.campaign_id`
    orderBy = 'MAX(ins.campaign_name)'
  } else if (aggregateBy === "adsets") {
    entityGrouping = `adset_id`
    selectString = `
      ins.adset_id as adset_id,
      MAX(ins.adset_name) as entity_name,
      MAX(adset.status) as status,
      MAX(CAST(COALESCE(adset.daily_budget, '0') AS FLOAT)) as daily_budget,
      MAX(TO_CHAR(adset.created_time::date, 'mm/dd/yy')) as launch_date,
    `
    joinString = `
      JOIN adsets adset ON adset.provider_id = ins.adset_id
      JOIN ad_accounts ad ON ad.id = adset.ad_account_id
    `
    groupBy = `ins.adset_id`
    orderBy = 'MAX(ins.adset_name)'
  }

  const query = `
    WITH insights_report AS (
      SELECT
        MAX(ad.name) as ad_account_name,
        MAX(ad.tz_name) as time_zone,
        ${selectString}
        ROUND(CAST(SUM(ins.spend) + SUM(unallocated_spend) AS numeric), 2) as amount_spent,
        ROUND(CAST(SUM(ins.impressions) AS numeric), 2) as impressions,
        ROUND(CAST(SUM(ins.link_clicks) AS numeric), 2) as link_clicks,
        TRUNC(CASE WHEN SUM(ins.link_clicks::numeric) = 0 THEN 0 ELSE (SUM(ins.spend)::numeric / SUM(ins.link_clicks)::numeric) END, 2) as cpc_link_click,
        SUM(ins.ts_clicks) as clicks,
        ROUND(CASE WHEN SUM(ins.ts_clicks::numeric) = 0 THEN 0 ELSE (SUM(ins.spend)::numeric / SUM(ins.ts_clicks)::numeric) END, 2) as cpc_all,
        ROUND(CASE WHEN SUM(ins.impressions::numeric) = 0 THEN 0 ELSE (SUM(ins.spend)::numeric / (SUM(ins.impressions::numeric) / 1000::numeric)) END, 2) as cpm,
        ROUND(CASE WHEN SUM(ins.ts_clicks)::numeric = 0 THEN 0 ELSE (SUM(ins.ts_clicks)::numeric / SUM(ins.impressions)::numeric) * 100 END, 2) || '%' as ctr_fb,
        TO_CHAR(MAX(ins.ts_updated_at), 'dd/HH24:MI') as ts_updated_at,
        ROUND(CAST(SUM(ins.tracked_visitors) AS numeric), 2) as visitors,
        ROUND(CAST(SUM(ins.lander_visits) AS numeric), 2) as lander_visits,
        ROUND(CAST(SUM(ins.searches) AS numeric), 2) as lander_searches,
        ROUND(CAST(SUM(ins.nw_conversions) AS numeric), 2) as revenue_events,
        ${
          network === 'sedo' ? `
            ROUND(CAST(SUM(ins.pb_lander_conversions) AS numeric), 2) as pb_lander_conversions,
            0 as pb_serp_conversions,
            ROUND(CAST(SUM(ins.pb_conversions) AS numeric), 2) as pb_conversions,
          `: ``
        }
        CASE WHEN SUM(ins.tracked_visitors) = 0 THEN null ELSE ROUND(CAST(CAST(SUM(nw_conversions) as float) / CAST(SUM(tracked_visitors) as float) * 100 as numeric), 2) || '%' END ctr_cr,
        CASE WHEN SUM(ins.nw_conversions) = 0 THEN null ELSE ROUND(CAST(SUM(ins.revenue) / SUM(ins.nw_conversions) as numeric), 2) END rpc,
        CASE WHEN SUM(ins.tracked_visitors) = 0 THEN null ELSE ROUND(CAST(SUM(ins.revenue) / SUM(ins.tracked_visitors) * 1000 as numeric), 2) END rpm,
        CASE WHEN SUM(ins.tracked_visitors) = 0 THEN null ELSE ROUND(CAST(SUM(ins.revenue) / SUM(ins.tracked_visitors) as numeric), 2) END rpv,
        ROUND((SUM(ins.revenue) + SUM(unallocated_revenue))::numeric, 2) as publisher_revenue,
        TO_CHAR(MAX(ins.network_updated_at), 'dd/HH24:MI') as nw_updated_at,
        TO_CHAR(CURRENT_TIMESTAMP, 'dd/HH24:MI (TZ)') as sheet_last_update
      FROM insights ins
        ${joinString}
      WHERE ins.date >= '${startDate}' AND ins.date <= '${endDate}' AND ins.traffic_source = '${trafficSource}' AND ins.network = '${network}'
      GROUP BY ${groupBy}
      ORDER BY MAX(ins.campaign_name)
  ) ${POSTBACKS(entityGrouping, startDate, endDate, trafficSource, network)}
  SELECT
    ins.*,
    ${
      network === 'crossroads' ? `
        live_pb.pb_lander_conversions,
        live_pb.pb_serp_conversions,
        live_pb.pb_conversions
      ` : network === 'sedo' ? `
        ins.pb_lander_conversions as pb_lander_conversions,
        ins.pb_serp_conversions as pb_serp_conversions,
        ins.pb_conversions as pb_conversions
      ` : ``
    }
  FROM insights_report ins
  ${
    network === 'crossroads' ? `FULL OUTER JOIN live_postbacks live_pb ON live_pb.${entityGrouping} = ins.${entityGrouping}` : ''
  }
  `
  const data = await database.raw(query)
  const { rows } = data;
  return rows
}

module.exports = revealBotSheets

