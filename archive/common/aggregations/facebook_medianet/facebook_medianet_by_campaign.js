const db = require('../../../../data/dbConfig');
const selects = require("../selects");

const facebookMedianetByCampaignId = (campaign_id, startDate, endDate) => {
  query = `
      WITH inpulse AS (
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
      ), agg_mn AS (
        SELECT
            date as mn_date,
            adset_id,
            SUM(impressions) AS pbImpressions,
            SUM(total_clicks) AS total_clicks,
            SUM(estimated_revenue) AS revenue
        FROM
            media_net_stats
        WHERE
            date > '${startDate}' AND date <= '${endDate}'
        AND
            campaign_id = '${campaign_id}'
        GROUP BY
            adset_id, date
    ), agg_fb AS (
        SELECT
          fb.date as fb_date,
          fb.adset_id,
          MAX(fb.campaign_name) as campaign_name,
          MAX(ad.name) as account_name,
            ${selects.FACEBOOK}
          FROM facebook_partitioned fb
            INNER JOIN campaigns c ON fb.campaign_id = c.id AND c.traffic_source = 'facebook'
            INNER JOIN ad_accounts ad ON ad.id = c.ad_account_id
          WHERE  fb.date >  '${startDate}'
          AND  fb.date <= '${endDate}'
          AND fb.campaign_id = '${campaign_id}'
        GROUP BY fb.date, fb.adset_id
    ), agg_adsets AS (
          SELECT MAX(adsets.provider_id) as adset_id,
                MAX(adsets.name) as adset_name,
                MAX(adsets.campaign_id) as campaign_id
          FROM adsets
          WHERE adsets.campaign_id = '${campaign_id}'
          GROUP BY adsets.provider_id
    )
    SELECT
      agg_fb.adset_id,
      MAX(agg_adsets.adset_name) as adset_name,
      MAX(agg_adsets.campaign_id) as campaign_id,
      CAST(ROUND(SUM(agg_fb.spend)::decimal, 2) AS FLOAT) as spend,
      CAST (
        ROUND(
          SUM(
            CASE
              WHEN agg_fb.account_name LIKE '%Nitido%' THEN agg_fb.spend * 1.02
              WHEN agg_fb.account_name LIKE '%Rebate%' THEN agg_fb.spend * 1.03
              WHEN agg_fb.account_name LIKE '%INPULSE%' OR agg_fb.account_name LIKE '%CSUY%' THEN agg_fb.spend * inp.coefficient
              ELSE agg_fb.spend
            END
          )::decimal, 2
        ) AS FLOAT
      ) as spend_plus_fee,
      CAST(SUM(agg_fb.fb_conversions) AS INTEGER) as fb_conversions,
      CAST(SUM(agg_mn.pbImpressions) AS INTEGER) as pbImpressions,
      CAST(SUM(agg_fb.impressions) AS INTEGER) as impressions,
      CAST(SUM(agg_fb.link_clicks) AS INTEGER) as link_clicks,
      CAST(SUM(agg_mn.total_clicks) AS INTEGER) as total_clicks,
      CAST(SUM(agg_mn.revenue) AS INTEGER) as revenue
    FROM agg_mn
      FULL OUTER JOIN agg_fb ON agg_fb.adset_id = agg_mn.adset_id AND agg_fb.fb_date = agg_mn.mn_date
      FULL OUTER JOIN agg_adsets ON agg_adsets.adset_id = agg_mn.adset_id
      INNER JOIN inpulse inp ON inp.coefficient_date = agg_fb.fb_date
    GROUP BY agg_fb.adset_id;
  `
  return db.raw(query);
}

module.exports = facebookMedianetByCampaignId;
