const { buildConditionsInsights, buildSelectionColumns, castSum } = require("./utils");

async function trafficSourceNetworkCampaignsAdsetsStats(
  database,
  startDate,
  endDate,
  network = 'crossroads',
  trafficSource,
  mediaBuyer,
  ad_accounts
) {
  const { mediaBuyerCondition, adAccountCondition } = buildConditionsInsights(mediaBuyer, ad_accounts);

  // Construct the query
  const query = `
    WITH ads_data AS (
      SELECT
        analytics.campaign_id,
        MAX(analytics.campaign_name) AS campaign_name,
        analytics.adset_id,
        MAX(analytics.adset_name) AS adset_name,
        'ad' AS row_type,
        analytics.ad_id,
        ${
          trafficSource !== 'unknown' ?
          `MAX(ads.name) AS ad_name,
           MAX(adlinks.version) AS version,
           MAX(adlinks.synced) AS synced,` : ``
        }
        analytics.nw_campaign_id AS nw_campaign_id,
        MAX(analytics.nw_campaign_name) AS nw_campaign_name,
        0 AS nw_uniq_conversions,
        ${buildSelectionColumns("analytics.", true)},  -- calculateSpendRevenue=true
        MAX(analytics.ad_account_name) AS ad_account_name,
        MAX(analytics.domain_name) AS domain_name
      FROM analytics
      ${
        trafficSource !== 'unknown' ?
        `
        INNER JOIN ads ON analytics.ad_id = ads.id
        JOIN adlinks ON analytics.ad_id = adlinks.id` : ``
      }
      WHERE
        DATE(analytics.timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') > '${startDate}'
        AND DATE(analytics.timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') <= '${endDate}'
        AND analytics.traffic_source = '${trafficSource}'
        AND analytics.network = '${network}'
        ${mediaBuyerCondition ? `AND ${mediaBuyerCondition}` : ''}
        ${adAccountCondition ? `AND ${adAccountCondition}` : ''}
      GROUP BY
        analytics.campaign_id,
        analytics.adset_id,
        analytics.ad_id,
        analytics.nw_campaign_id
    ),
    adset_data AS (
      SELECT
        ads_data.campaign_id,
        ads_data.adset_id,
        'adset' AS row_type,
        MAX(ads_data.campaign_name) AS campaign_name,
        ads_data.nw_campaign_id AS nw_campaign_id,
        MAX(ads_data.nw_campaign_name) AS nw_campaign_name,
        ${
          trafficSource !== 'unknown' ?
          `
          ${
            trafficSource !== 'taboola' ?
            `
            MAX(adsets.status) AS status,
            CAST(COALESCE(MAX(adsets.daily_budget), '0') AS FLOAT) AS daily_budget,
            CASE WHEN CAST(COALESCE(MAX(adsets.daily_budget), '0') AS FLOAT) > 0 THEN TRUE ELSE FALSE END AS editable_budget,
            ` :
            `
            MAX(c.status) AS status,
            CAST(COALESCE(MAX(c.daily_budget), '0') AS FLOAT) * 100 AS daily_budget,
            'campaign' AS budget_level,
            `
          }
          ` : ``
        }
        MAX(ads_data.adset_name) AS adset_name,
        0 AS nw_uniq_conversions,
        ${buildSelectionColumns("ads_data.", true)},  -- calculateSpendRevenue=true
        MAX(ads_data.ad_account_name) AS ad_account_name,
        MAX(ads_data.domain_name) AS domain_name,
        JSON_AGG(ads_data.*) AS subrows
      FROM ads_data
      ${
        trafficSource !== 'unknown' ?
        `
        JOIN ${
          trafficSource !== 'taboola' ?
          `adsets ON ads_data.adset_id = adsets.provider_id` :
          `campaigns c ON c.id = ads_data.campaign_id`
        }
        ` : ``
      }
      GROUP BY
        ads_data.campaign_id,
        ads_data.adset_id,
        ads_data.nw_campaign_id
    ),
    offer_data AS (
      SELECT
        nw_campaign_id,
        SUM(CASE WHEN traffic_source = 'unknown' THEN revenue ELSE 0 END) AS unknown_revenue,
        SUM(CASE WHEN traffic_source != 'unknown' THEN revenue ELSE 0 END) AS known_revenue,
        SUM(revenue) AS total_revenue
      FROM analytics
      WHERE
        DATE(analytics.timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') > '${startDate}'
        AND DATE(analytics.timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') <= '${endDate}'
        AND analytics.network = '${network}'
        ${mediaBuyerCondition ? `AND ${mediaBuyerCondition}` : ''}
        ${adAccountCondition ? `AND ${adAccountCondition}` : ''}
      GROUP BY
        nw_campaign_id
    ),
    adset_coefficients AS (
      SELECT
        ad.nw_campaign_id,
        ad.adset_id,
        CASE
          WHEN od.known_revenue > 0 THEN ad.revenue / od.known_revenue
          ELSE 1.0 / COUNT(*) OVER (PARTITION BY ad.nw_campaign_id)
        END AS revenue_coefficient
      FROM adset_data ad
      JOIN offer_data od ON ad.nw_campaign_id = od.nw_campaign_id
    )
    SELECT
      ad.campaign_id,
      'campaign' AS row_type,
      ${castSum("ad.spend", "FLOAT")} AS spend,
      ${castSum("ad.spend_plus_fee", "FLOAT")} AS spend_plus_fee,
      ${castSum("ad.revenue", "FLOAT")} AS revenue,
      ${buildSelectionColumns("ad.", false)},  -- calculateSpendRevenue=false
      ${
        trafficSource !== 'unknown' ?
        `
        CAST(SUM(ad.revenue) + SUM(od.unknown_revenue * ac.revenue_coefficient) AS FLOAT) AS estimated_revenue,
        CAST(MAX(od.total_revenue) AS FLOAT) AS total_offer_revenue,
        COALESCE(MAX(ad.campaign_name), MAX(c.name)) AS campaign_name,
        MAX(c.status) AS status,
        MAX(c.created_at) AS created_at,
        CASE
          WHEN SUM(ad.daily_budget) > 0 THEN FALSE
          ELSE TRUE
        END AS editable_budget,
        CASE
          WHEN SUM(ad.daily_budget) > 0 THEN SUM(
            CASE WHEN ad.status = 'ACTIVE' THEN ad.daily_budget ELSE 0 END
          )
          ELSE CAST(MAX(c.daily_budget) AS FLOAT)
        END AS daily_budget,
        ` : `MAX(ad.nw_campaign_name) AS campaign_name,`
      }
      MAX(ad.ad_account_name) AS ad_account_name,
      ${trafficSource === 'taboola' ? 'NULL' : `json_agg(ad.*)`} AS subrows,
      MAX(ad.domain_name) AS domain_name
    FROM adset_data ad
    JOIN offer_data od ON ad.nw_campaign_id = od.nw_campaign_id
    JOIN adset_coefficients ac ON ad.nw_campaign_id = ac.nw_campaign_id AND ad.adset_id = ac.adset_id
    ${
      trafficSource !== 'unknown' ?
      `JOIN campaigns c ON ad.campaign_id = c.id` : ``
    }
    GROUP BY ad.campaign_id, ad.campaign_name, ad.nw_campaign_id
  `;

  const { rows } = await database.raw(query);
  console.log(rows);
  return rows;
}

module.exports = trafficSourceNetworkCampaignsAdsetsStats;
