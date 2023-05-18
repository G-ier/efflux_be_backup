const db = require('../../data/dbConfig');
const { dayYMD, yesterdayYMD } = require('../day');
const selects = require("./selects");

function hourlyMediaBuyerFacebookCrossroads(start_date, end_date, mediaBuyer, campaignId, adAccountId, q) {
  // TODO Find the way to enable mediaBuyer filter. Prefix is not an option (system1) Probably we need to attach mediaBuyerId to data entry

  const campaignIDCondition = campaignId
    ? `AND campaign_id = '${campaignId}'`
    : '';

  const mediaBuyerCondition = (mediaBuyer !== 'admin' && mediaBuyer)
    ? `AND user_id = ${mediaBuyer}`
    : '';

  const adAccountIdCondition = adAccountId
    ? `AND ad_account_id = ${adAccountId}`
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
    WITH agg_s1 AS (
      SELECT DISTINCT ON(s1.hour, s1.date) s1.hour as s1_hour, s1.date as s1_date,
        ${selects.SYSTEM1}
      FROM system1_partitioned s1
        INNER JOIN campaigns c ON s1.campaign_id = c.id
            AND c.traffic_source = 'facebook'
            --AND c.network = 'system1'
            ${mediaBuyerCondition}
            ${adAccountIdCondition}
            ${queryCondition}
      WHERE  s1.date >  '${startDate}'
        AND  s1.date <= '${endDate}'
        ${campaignIDCondition}
      GROUP BY  s1.hour, s1.date
    ), agg_fb AS (
      SELECT DISTINCT ON(fb.hour, fb.date) fb.hour as fb_hour, fb.date as fb_date,
        ${selects.FACEBOOK}
      FROM facebook_partitioned fb
        INNER JOIN campaigns c ON fb.campaign_id = c.id
          AND c.traffic_source = 'facebook'
          --AND c.network = 'system1'
          ${mediaBuyerCondition}
          ${adAccountIdCondition}
          ${queryCondition}
      WHERE  fb.date >  '${startDate}'
        AND  fb.date <= '${endDate}'
        ${campaignIDCondition}
      GROUP BY fb.hour, fb.date
    ), agg_pb_s1 AS (
      SELECT DISTINCT ON(pb_s1.hour, pb_s1.date) pb_s1.hour as pb_s1_hour, pb_s1.date as pb_s1_date,
        ${selects.PB_SYSTEM1}
      FROM s1_conversions_partitioned pb_s1
        INNER JOIN campaigns c ON pb_s1.campaign_id = c.id
          AND c.traffic_source = 'facebook'
          --AND c.network = 'system1'
          ${mediaBuyerCondition}
          ${adAccountIdCondition}
          ${queryCondition}
      WHERE  pb_s1.date >  '${startDate}'
        AND  pb_s1.date <= '${endDate}'
        ${campaignIDCondition}
      GROUP BY pb_s1.hour, pb_s1.date
    )
      SELECT
        (CASE
          WHEN agg_fb.fb_date IS NOT null THEN agg_fb.fb_date
          WHEN agg_s1.s1_date IS NOT null THEN agg_s1.s1_date
          WHEN agg_pb_s1.pb_s1_date IS NOT null THEN agg_pb_s1.pb_s1_date
        END) as date,
        (CASE
          WHEN agg_fb.fb_hour IS NOT null THEN agg_fb.fb_hour
          WHEN agg_s1.s1_hour IS NOT null THEN agg_s1.s1_hour
          WHEN agg_pb_s1.pb_s1_hour IS NOT null THEN agg_pb_s1.pb_s1_hour
        END) as hour,
        ${selects.FACEBOOK_SYSTEM1}
      FROM agg_s1
          INNER JOIN agg_fb ON agg_s1.s1_hour = agg_fb.fb_hour AND agg_s1.s1_date = agg_fb.fb_date
          INNER JOIN agg_pb_s1 ON agg_s1.s1_hour = agg_pb_s1.pb_s1_hour AND agg_s1.s1_date = agg_pb_s1.pb_s1_date
      GROUP BY
          agg_s1.s1_hour, agg_fb.fb_hour, agg_pb_s1.pb_s1_hour,
          agg_s1.s1_date, agg_fb.fb_date, agg_pb_s1.pb_s1_date
  `
  return db.raw(query);
}

module.exports = hourlyMediaBuyerFacebookCrossroads;
