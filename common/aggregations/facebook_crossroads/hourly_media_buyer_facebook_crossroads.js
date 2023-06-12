const db = require('../../../data/dbConfig');
const { dayYMD, yesterdayYMD } = require('../../day');
const selects = require("../selects");

function hourlyMediaBuyerFacebookCrossroads(start_date, end_date, mediaBuyer, campaignId, adAccountId, q) {
  `
  Summary:
    Gets the data from crossroads, facebook and postback_events tables
    , queries by date and aggreagates it by date and hour.

    The problem i think it's worth noting for both 1/ and /3 is the date aggregations. When i aggregate by hour in facebook, hour is on the ad
    account time zone while date in utc, which is a incogruency inside facebook data. Other than this we join this grouping with crossroads
    and postback data which are in PST. And the start and end date is in the perspective of PST.

  Params:
    startDate: the start date of the data
    endDate: the end date of the data
    mediaBuyer (optional): the media buyer id
    campaignId (optional): the campaign id
    adAccountId (optional): the ad account id
    q (optional): the search query

  Returns:
    the aggregated data for that timespan of the 3 tables
  `

  const campaignIDCondition = campaignId
    ? `AND campaign_id = '${campaignId}'`
    : '';

  const mediaBuyerCondition = (mediaBuyer !== 'admin' && mediaBuyer)
    ? `AND user_id = ${mediaBuyer}`
    : '';

  const adAccountIdCondition = adAccountId
    ? `AND c.ad_account_id = ${adAccountId}`
    : '';

  const queryCondition = q
    ? `AND c.name iLike '%${q}%'`
    : '';

  const startDate = yesterdayYMD(start_date);
  const endDate = dayYMD(end_date);

  /**
   * DISTINCT ON (hour) lets us ensure there are no duplicates (it is optional btw)
   * BUT Don't group by anything except hour, if you don't want to lose data
   */
  query = `

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
      cr.hour as cr_hour,
      cr.date as cr_date,
        ${selects.CROSSROADS_PARTITIONED}
    FROM crossroads_partitioned cr
    ${
      (mediaBuyerCondition !== '' || adAccountIdCondition !== '' || queryCondition !== '')
        ? `INNER JOIN campaigns c ON cr.campaign_id = c.id`
        : ''
    }
      ${mediaBuyerCondition}
      ${adAccountIdCondition}
      ${queryCondition}
    WHERE  cr.request_date >  '${startDate}'
      AND  cr.request_date <= '${endDate}'
      AND  cr.traffic_source = 'facebook'
      ${campaignIDCondition}
    GROUP BY  cr.hour, cr.date
  ), agg_fb AS (
    SELECT
      fb.date as fb_date,
      fb.hour as fb_hour,
      CAST(ROUND(SUM(CASE WHEN ad.name LIKE '%Nitido%' THEN fb.total_spent ELSE 0 END)::decimal, 2) AS FLOAT) as nitido_spend,
      CAST(ROUND(SUM(CASE WHEN ad.name LIKE '%Rebate%' THEN fb.total_spent ELSE 0 END)::decimal, 2) AS FLOAT) as rebate_spend,
      CAST(ROUND(SUM(CASE WHEN ad.name LIKE '%INPULSE%' OR ad.name LIKE '%CSUY%' THEN fb.total_spent ELSE 0 END)::decimal, 2) AS FLOAT) as inpulse_spend,
      CAST(ROUND(SUM(CASE WHEN ad.name NOT LIKE '%INPULSE%' AND ad.name NOT LIKE '%CSUY%' AND ad.name NOT LIKE '%Rebate%' AND ad.name NOT LIKE '%Nitido%' THEN fb.total_spent ELSE 0 END)::decimal, 2) AS FLOAT) as own_spend,
      ${selects.FACEBOOK}
    FROM facebook_partitioned fb
    INNER JOIN campaigns c ON c.id = fb.campaign_id AND c.traffic_source = 'facebook'
      ${mediaBuyerCondition}
      ${adAccountIdCondition}
      ${queryCondition}
    INNER JOIN ad_accounts ad ON ad.id = c.ad_account_id
    WHERE  fb.date >  '${startDate}'
      AND  fb.date <= '${endDate}'
      AND fb.campaign_id IN (SELECT campaign_id FROM restriction)
      ${campaignIDCondition}
    GROUP BY fb.hour, fb_date
  ), agg_fbc AS (
    SELECT
    pb.hour as fbc_hour,
    pb.date as fbc_date,
    CAST(COUNT(CASE WHEN pb.event_type = 'Purchase' THEN 1 ELSE null END) AS INTEGER) as pb_conversions,
    CAST(COUNT(CASE WHEN pb.event_type = 'PageView' THEN 1 ELSE null END) AS INTEGER) as pb_lander_conversions,
    CAST(COUNT(CASE WHEN pb.event_type = 'ViewContent' THEN 1 ELSE null END) AS INTEGER) as pb_serp_conversions,
    MAX(pb.updated_at) as last_updated,
    CAST(COUNT(distinct (CASE WHEN pb.event_type = 'lead' THEN fbclid END)) AS INTEGER) as pb_uniq_conversions
    FROM postback_events_partitioned pb
    ${
      (mediaBuyerCondition !== '' || adAccountIdCondition !== '' || queryCondition !== '')
        ? `INNER JOIN campaigns c ON pb.campaign_id = c.id`
        : ''
    }
      ${mediaBuyerCondition}
      ${adAccountIdCondition}
      ${queryCondition}
    WHERE  pb.date >  '${startDate}'
      AND  pb.date <= '${endDate}'
      AND pb.traffic_source = 'facebook'
      AND pb.network = 'crossroads'
      ${campaignIDCondition}
    GROUP BY pb.hour, pb.date
  )
  SELECT
      agg_fb.fb_hour as hour,
      CAST(
        ROUND(
          SUM(
            agg_fb.nitido_spend * 1.02 +
            agg_fb.rebate_spend * 1.03 +
            inpulse_spend * inp.coefficient +
            own_spend
          )::decimal, 2
        ) AS FLOAT
      ) as spend_plus_fee,
     ${selects.FACEBOOK_CROSSROADS}
  FROM agg_cr
     FULL OUTER JOIN agg_fb ON agg_cr.cr_hour = agg_fb.fb_hour AND agg_cr.cr_date = agg_fb.fb_date
     FULL OUTER JOIN agg_fbc ON agg_fbc.fbc_hour = agg_fb.fb_hour AND agg_fbc.fbc_date = agg_fb.fb_date
     INNER JOIN inpulse inp ON inp.coefficient_date = agg_fb.fb_date
     GROUP BY agg_fb.fb_hour;
  `

  return db.raw(query);
}
module.exports = hourlyMediaBuyerFacebookCrossroads;
