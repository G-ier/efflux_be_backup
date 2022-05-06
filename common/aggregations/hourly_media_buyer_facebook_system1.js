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
  return db.raw(`
      WITH agg_s1 AS (
        SELECT DISTINCT ON(s1.hour, s1.date) s1.hour, s1.date,
          ${selects.SYSTEM1}
        FROM system1 s1
          INNER JOIN campaigns c ON s1.campaign_id = c.id
              AND c.traffic_source = 'facebook'
              AND c.network = 'system1'
              ${mediaBuyerCondition}
              ${adAccountIdCondition}
              ${queryCondition}
        WHERE  s1.date >  '${startDate}'
          AND  s1.date <= '${endDate}'
          ${campaignIDCondition}
        GROUP BY  s1.hour, s1.date
      ), agg_fb AS (
        SELECT DISTINCT ON(fb.hour, fb.date) fb.hour, fb.date,
          ${selects.FACEBOOK}
        FROM facebook fb
          INNER JOIN campaigns c ON fb.campaign_id = c.id
            AND c.traffic_source = 'facebook'
            AND c.network = 'system1'
            ${mediaBuyerCondition}
            ${adAccountIdCondition}
            ${queryCondition}
        WHERE  fb.date >  '${startDate}'
          AND  fb.date <= '${endDate}'
          ${campaignIDCondition}
        GROUP BY fb.hour, fb.date
      ), agg_pb_s1 AS (
        SELECT DISTINCT ON(pb_s1.hour, pb_s1.date) pb_s1.hour, pb_s1.date,
           ${selects.PB_SYSTEM1}
        FROM s1_conversions pb_s1
          INNER JOIN campaigns c ON pb_s1.campaign_id = c.id
            AND c.traffic_source = 'facebook'
            AND c.network = 'system1'
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
            WHEN agg_fb.date IS NOT null THEN agg_fb.date
            WHEN agg_s1.date IS NOT null THEN agg_s1.date
            WHEN agg_pb_s1.date IS NOT null THEN agg_pb_s1.date
          END) as date,
          (CASE
            WHEN agg_fb.hour IS NOT null THEN agg_fb.hour
            WHEN agg_s1.hour IS NOT null THEN agg_s1.hour
            WHEN agg_pb_s1.hour IS NOT null THEN agg_pb_s1.hour
          END) as hour,
          ${selects.FACEBOOK_SYSTEM1}
        FROM agg_s1
            FULL OUTER JOIN agg_fb USING (hour, date)
            FULL OUTER JOIN agg_pb_s1 USING (hour, date)
        GROUP BY
            agg_s1.hour, agg_fb.hour, agg_pb_s1.hour,
            agg_s1.date, agg_fb.date, agg_pb_s1.date
  `);
}

module.exports = hourlyMediaBuyerFacebookCrossroads;
