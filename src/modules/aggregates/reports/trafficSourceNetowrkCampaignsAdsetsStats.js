const { buildConditionsInsights, buildSelectionColumns, castSum } = require("./utils");

async function trafficSourceNetowrkCampaignsAdsetsStats(database, startDate, endDate, network='crossroads', trafficSource, mediaBuyer, ad_accounts) {
  const { mediaBuyerCondition, adAccountCondition } = buildConditionsInsights(mediaBuyer, ad_accounts);

  const query = `
  WITH adset_data AS (
    SELECT
      analytics.campaign_id,
      analytics.adset_id,
      MAX(campaign_name) as campaign_name,
      analytics.nw_campaign_id AS nw_campaign_id,
      MAX(analytics.nw_campaign_name) as nw_campaign_name,
      ${
        trafficSource !== 'unknown' ?
        `
        ${
          trafficSource !== 'taboola' ?
            `MAX(adsets.status) as status,
            CAST(COALESCE(MAX(adsets.daily_budget), '0') AS FLOAT) as daily_budget,`
          :
            `MAX(c.status) as status,
            CAST(COALESCE(MAX(c.daily_budget), '0') AS FLOAT) * 100 as daily_budget,`
        }
        ` :
        ``
      }

      MAX(analytics.adset_name) as adset_name,
      0 as nw_uniq_conversions,
      ${buildSelectionColumns("analytics.", calculateSpendRevenue=true)},
      MAX(analytics.ad_account_name) as ad_account_name,
      MAX(analytics.domain_name) as domain_name
    FROM
      analytics
    ${
      trafficSource !== 'unknown' ?
      `
      JOIN ${
        trafficSource !== 'taboola' ?
          `adsets ON analytics.adset_id = adsets.provider_id`
        :
          `campaigns c ON c.id = analytics.campaign_id`
        }
      ` :
      ``
    }
    WHERE
      DATE(timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') > '${startDate}'
      AND DATE(timeframe AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') <= '${endDate}'
      AND analytics.traffic_source = '${trafficSource}'
      AND analytics.network = '${network}'
      ${mediaBuyerCondition}
      ${adAccountCondition}
    GROUP BY
      analytics.campaign_id, analytics.adset_id, analytics.nw_campaign_id
  )
  SELECT
    ad.campaign_id,
    ${castSum("ad.spend", "FLOAT")} as spend,
    ${castSum("ad.spend_plus_fee", "FLOAT")} as spend_plus_fee,
    ${castSum("ad.revenue", "FLOAT")} as revenue,
    ${buildSelectionColumns("ad.", calculateSpendRevenue=false)},

    ${
      trafficSource !== 'unknown' ?
      `
        COALESCE(MAX(ad.campaign_name), MAX(c.name)) as campaign_name,
        MAX(c.status) as status,
        MAX(c.created_at) as created_at,
        CASE
          WHEN SUM(ad.daily_budget) > 0 THEN 'adset'
          ELSE 'campaign'
        END AS budget_level,
        CASE
          WHEN SUM(ad.daily_budget) > 0 THEN SUM(
          CASE WHEN ad.status = 'ACTIVE' THEN ad.daily_budget ELSE 0 END
          )
          ELSE CAST(MAX(c.daily_budget) AS FLOAT)
        END AS daily_budget,
      ` :
      `MAX(ad.nw_campaign_name) as campaign_name,`
    }
    MAX(ad.ad_account_name) as ad_account_name,

    ${trafficSource === 'taboola' ? 'NULL' : `json_agg(ad.*)` } as adsets,

    MAX(ad.domain_name) as domain_name

    FROM
      adset_data ad
    ${
      trafficSource !== 'unknown' ?
      `
      JOIN campaigns c ON ad.campaign_id = c.id
      ` :
      ``
    }
    GROUP BY
      ad.campaign_id, ad.campaign_name, ad.nw_campaign_id
  `;
  console.log(query);
  const { rows } = await database.raw(query);
  return rows;
}

module.exports = trafficSourceNetowrkCampaignsAdsetsStats;
