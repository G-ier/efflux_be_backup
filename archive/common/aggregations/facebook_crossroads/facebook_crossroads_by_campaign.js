const db = require('../../../../data/dbConfig');
const selects = require("../selects");

const facebookCrossroadsByCampaignId = (campaign_id, startDate, endDate) => {
  `
  Summary:
    Gets the data from crossroads, facebook and postback_events tables for a specific campaign
    queries by campaign_id and date and aggregates it by adset_id.

  Params:
    campaign_id: the campaign id
    startDate: the start date of the data
    endDate: the end date of the data
  Returns:
    the aggregated data for that timespan of the 3 tables
    for a specific campaign
  `

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
  ), agg_cr AS (
    SELECT
      cr.request_date as cr_date,
      cr.adset_id,
      ${selects.CROSSROADS_PARTITIONED}
    FROM crossroads_partitioned cr
    WHERE    cr.request_date >  '${startDate}'
      AND    cr.request_date <= '${endDate}'
      AND    cr.campaign_id = '${campaign_id}'
    GROUP BY cr.adset_id, cr.request_date
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
      WHERE    fb.date >  '${startDate}'
        AND    fb.date <= '${endDate}'
        AND    fb.campaign_id = '${campaign_id}'
        GROUP BY fb.date, fb.adset_id
  ), agg_fbc AS (
        SELECT
          pb.adset_id,
          pb.date as pb_date,
          CAST(COUNT(CASE WHEN pb.event_type = 'PageView' THEN 1 ELSE null END) AS INTEGER) as pb_lander_conversions,
          CAST(COUNT(CASE WHEN pb.event_type = 'ViewContent' THEN 1 ELSE null END) AS INTEGER) as pb_serp_conversions,
          CAST(COUNT(CASE WHEN pb.event_type = 'Purchase' THEN 1 ELSE null END) AS INTEGER) as pb_conversions
        FROM postback_events_partitioned pb
        WHERE    pb.date >  '${startDate}'
          AND    pb.date <= '${endDate}'
          AND    pb.campaign_id = '${campaign_id}'
        GROUP BY pb.adset_id, pb.date
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
    ${selects.FACEBOOK_CROSSROADS}
    FROM agg_cr
      FULL OUTER JOIN agg_fb ON agg_fb.adset_id = agg_cr.adset_id AND agg_fb.fb_date = agg_cr.cr_date
      FULL OUTER JOIN agg_fbc ON agg_fbc.adset_id = agg_cr.adset_id AND agg_fb.fb_date = agg_fbc.pb_date
      FULL OUTER JOIN agg_adsets ON agg_adsets.adset_id = agg_cr.adset_id
      INNER JOIN inpulse inp ON inp.coefficient_date = agg_fb.fb_date
    GROUP BY agg_fb.adset_id;
  `;
  return db.raw(query);
};
module.exports = facebookCrossroadsByCampaignId;
