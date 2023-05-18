const db = require('../../../data/dbConfig');
const { dayYMD, yesterdayYMD } = require('../../day');
const selects = require("../selects");

function hourlyMediaBuyerFacebookCrossroads(start_date, end_date, mediaBuyer, campaignId, adAccountId, q) {
  // TODO Find the way to enable mediaBuyer filter. Prefix is not an option (crossroads) Probably we need to attach mediaBuyerId to data entry

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
  WITH agg_cr AS (
    SELECT cr.hour as cr_hour, cr.request_date as cr_date,
        ${selects.CROSSROADS_PARTITIONED}
    FROM crossroads_partitioned cr
      INNER JOIN campaigns c ON cr.campaign_id = c.id
          AND c.traffic_source = 'facebook'
          --AND c.network = 'crossroads'
          ${mediaBuyerCondition}
          ${adAccountIdCondition}
          ${queryCondition}
    WHERE  cr.request_date >  '${startDate}'
      AND  cr.request_date <= '${endDate}'
      ${campaignIDCondition}
    GROUP BY  cr.hour, cr.request_date
  ), agg_fb AS (
    SELECT fb.hour as fb_hour, fb.date as fb_date,
      ${selects.FACEBOOK}
    FROM facebook_partitioned fb
      INNER JOIN campaigns c ON fb.campaign_id = c.id
        AND c.traffic_source = 'facebook'
        --AND c.network = 'crossroads'
        ${mediaBuyerCondition}
        ${adAccountIdCondition}
        ${queryCondition}
    WHERE  fb.date >  '${startDate}'
      AND  fb.date <= '${endDate}'
      ${campaignIDCondition}
    GROUP BY fb.hour, fb.date
  ), agg_fbc AS (
    SELECT pb.hour as fbc_hour, pb.date as fbc_date,
    CAST(COUNT(CASE WHEN pb.event_type = 'Purchase' THEN 1 ELSE null END) AS INTEGER) as pb_conversions,
    CAST(COUNT(CASE WHEN pb.event_type = 'PageView' THEN 1 ELSE null END) AS INTEGER) as pb_lander_conversions,
    CAST(COUNT(CASE WHEN pb.event_type = 'ViewContent' THEN 1 ELSE null END) AS INTEGER) as pb_serp_conversions,
    MAX(pb.updated_at) as last_updated,
    CAST(COUNT(distinct (CASE WHEN pb.event_type = 'lead' THEN fbclid END)) AS INTEGER) as pb_uniq_conversions
    FROM postback_events_partitioned pb
      INNER JOIN campaigns c ON pb.campaign_id = c.id
        AND c.traffic_source = 'facebook'
        --AND c.network = 'crossroads'
        ${mediaBuyerCondition}
        ${adAccountIdCondition}
        ${queryCondition}
    WHERE  pb.date >  '${startDate}'
      AND  pb.date <= '${endDate}'
      ${campaignIDCondition}
    GROUP BY pb.hour, pb.date
  )
  SELECT
      (CASE
            WHEN agg_fb.fb_date IS NOT null THEN agg_fb.fb_date
            WHEN agg_cr.cr_date IS NOT null THEN agg_cr.cr_date
            WHEN agg_fbc.fbc_date IS NOT null THEN agg_fbc.fbc_date
      END) as date,
      (CASE
          WHEN agg_fb.fb_hour IS NOT null THEN agg_fb.fb_hour
          WHEN agg_cr.cr_hour IS NOT null THEN agg_cr.cr_hour
          WHEN agg_fbc.fbc_hour IS NOT null THEN agg_fbc.fbc_hour
      END) as hour,
     ${selects.FACEBOOK_CROSSROADS}
  FROM agg_cr
     INNER JOIN agg_fb ON agg_cr.cr_date = agg_fb.fb_date AND agg_cr.cr_hour = agg_fb.fb_hour
     FULL OUTER JOIN agg_fbc ON agg_fbc.fbc_date = agg_fb.fb_date AND agg_fbc.fbc_hour = agg_fb.fb_hour
     GROUP BY agg_cr.cr_hour, agg_fb.fb_hour, agg_fbc.fbc_hour,
              agg_cr.cr_date, agg_fb.fb_date, agg_fbc.fbc_date
  `
  // console.log(query);
  return db.raw(query);
}

module.exports = hourlyMediaBuyerFacebookCrossroads;
