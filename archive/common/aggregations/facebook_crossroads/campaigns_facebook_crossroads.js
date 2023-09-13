const db = require('../../../../data/dbConfig');
const selects = require("../selects");

function campaignsFacebookCrossroads(startDate, endDate, mediaBuyer, adAccount, q) {

  `
  Summary:
    Gets the data from crossroads, facebook and postback_events tables
    queries by date, optionally by media buyer and ad account and aggregates it by campaign_id.

  Params:
    startDate: the start date of the data
    endDate: the end date of the data
    mediaBuyer (optional): the media buyer id
    adAccount (optional): the ad account id
    q (optional): the search query

  Returns:
    the aggregated data for that timespan of the 3 tables
  `

  const mediaBuyerCondition = (mediaBuyer !== 'admin' && mediaBuyer)
    ? `AND user_id = ${mediaBuyer}`
    : '';

  const adAccountCondition = adAccount
    ? `AND c.ad_account_id = ${adAccount}`
    : '';

  const queryCondition = q
    ? `AND c.name ILIKE '%${q}%'`
    : '';

  let query = `
  WITH restriction AS (
    SELECT DISTINCT campaign_id
      FROM crossroads_partitioned
    WHERE
      request_date > '${startDate}' AND request_date <= '${endDate}'
    AND traffic_source = 'facebook'
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
  ), agg_cr AS (
    SELECT
      cr.campaign_id,
      cr.request_date as cr_date,
        ${selects.CROSSROADS_PARTITIONED}
    FROM crossroads_partitioned cr
    ${
      (mediaBuyerCondition !== '' || adAccountCondition !== '' || queryCondition !== '')
        ? `INNER JOIN campaigns c ON cr.campaign_id = c.id`
        : ''
    }
        ${mediaBuyerCondition}
        ${adAccountCondition}
        ${queryCondition}
    WHERE cr.request_date >  '${startDate}'
      AND cr.request_date <= '${endDate}'
      AND cr.traffic_source = 'facebook'
    GROUP BY cr.campaign_id, cr.request_date
  ), agg_fb AS (
    SELECT
        fb.date as fb_date,
        fb.campaign_id,
        MAX(c.name) as campaign_name,
        MAX(ad.name) as account_name,
        ${selects.FACEBOOK}
      FROM facebook_partitioned fb
      INNER JOIN campaigns c ON c.id = fb.campaign_id AND c.traffic_source = 'facebook'
          ${mediaBuyerCondition}
          ${adAccountCondition}
          ${queryCondition}
        INNER JOIN ad_accounts ad ON ad.id = c.ad_account_id
      WHERE  fb.date >  '${startDate}'
        AND  fb.date <= '${endDate}'
        AND fb.campaign_id IN (SELECT campaign_id FROM restriction)
        GROUP BY fb.date, fb.campaign_id
  ), agg_fbc AS (
      SELECT
      pb.campaign_id,
      pb.date as pb_date,
      CAST(COUNT(CASE WHEN pb.event_type = 'Purchase' THEN 1 ELSE null END) AS INTEGER) as pb_conversions,
      CAST(COUNT(CASE WHEN pb.event_type = 'PageView' THEN 1 ELSE null END) AS INTEGER) as pb_lander_conversions,
      CAST(COUNT(CASE WHEN pb.event_type = 'ViewContent' THEN 1 ELSE null END) AS INTEGER) as pb_serp_conversions,
        MAX(pb.updated_at) as last_updated,
        CAST(COUNT(distinct (CASE WHEN pb.event_type = 'lead' THEN fbclid END)) AS INTEGER) as pb_uniq_conversions
      FROM postback_events_partitioned as pb
      ${
        (mediaBuyerCondition !== '' || adAccountCondition !== '' || queryCondition !== '')
          ? `INNER JOIN campaigns c ON pb.campaign_id = c.id`
          : ''
      }
          ${mediaBuyerCondition}
          ${adAccountCondition}
          ${queryCondition}
      WHERE pb.date > '${startDate}' AND pb.date <= '${endDate}'
      AND pb.traffic_source = 'facebook'
      GROUP BY pb.campaign_id, pb.date
  )
  SELECT
    agg_fb.campaign_id,
    MAX(agg_fb.campaign_name) as campaign_name,
    MAX(agg_fb.account_name) as account_name,
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
    FROM agg_fb
      INNER JOIN inpulse inp ON inp.coefficient_date = agg_fb.fb_date
      FULL OUTER JOIN agg_cr ON agg_fb.campaign_id = agg_cr.campaign_id AND agg_fb.fb_date = agg_cr.cr_date
      FULL OUTER JOIN agg_fbc ON agg_fb.campaign_id = agg_fbc.campaign_id AND agg_fb.fb_date = agg_fbc.pb_date
    GROUP BY agg_fb.campaign_id;
  `;
  return db.raw(query);

}

module.exports = campaignsFacebookCrossroads;
