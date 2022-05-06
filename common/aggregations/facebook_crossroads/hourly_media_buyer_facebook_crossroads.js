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
  return db.raw(`
      WITH agg_cr AS (
        SELECT cr.hour, cr.request_date as date,
         ${selects.CROSSROADS}
        FROM crossroads_stats cr
          INNER JOIN campaigns c ON cr.campaign_id = c.id
              AND c.traffic_source = 'facebook'
              AND c.network = 'crossroads'
              ${mediaBuyerCondition}
              ${adAccountIdCondition}
              ${queryCondition}
        WHERE  cr.request_date >  '${startDate}'
          AND  cr.request_date <= '${endDate}'
          ${campaignIDCondition}
        GROUP BY  cr.hour, cr.request_date
      ), agg_fb AS (
        SELECT fb.hour, fb.date,
          ${selects.FACEBOOK}
        FROM facebook fb
          INNER JOIN campaigns c ON fb.campaign_id = c.id
            AND c.traffic_source = 'facebook'
            AND c.network = 'crossroads'
            ${mediaBuyerCondition}
            ${adAccountIdCondition}
            ${queryCondition}
        WHERE  fb.date >  '${startDate}'
          AND  fb.date <= '${endDate}'
          ${campaignIDCondition}
        GROUP BY fb.hour, fb.date
      ), agg_fbc AS (
        SELECT fbc.hour, fbc.date,
        ${selects.FACEBOOK_CONVERSIONS}
        FROM fb_conversions fbc
          INNER JOIN campaigns c ON fbc.campaign_id = c.id
            AND c.traffic_source = 'facebook'
            AND c.network = 'crossroads'
            ${mediaBuyerCondition}
            ${adAccountIdCondition}
            ${queryCondition}
        WHERE  fbc.date >  '${startDate}'
          AND  fbc.date <= '${endDate}'
          ${campaignIDCondition}
        GROUP BY fbc.hour, fbc.date
      )
        SELECT
          (CASE
                WHEN agg_fb.date IS NOT null THEN agg_fb.date
                WHEN agg_cr.date IS NOT null THEN agg_cr.date
                WHEN agg_fbc.date IS NOT null THEN agg_fbc.date
          END) as date,
          (CASE
              WHEN agg_fb.hour IS NOT null THEN agg_fb.hour
              WHEN agg_cr.hour IS NOT null THEN agg_cr.hour
              WHEN agg_fbc.hour IS NOT null THEN agg_fbc.hour
          END) as hour,
         ${selects.FACEBOOK_CROSSROADS}
        FROM agg_cr
        FULL OUTER JOIN agg_fb USING (hour, date)
        FULL OUTER JOIN agg_fbc USING (hour, date)
        GROUP BY agg_cr.hour, agg_fb.hour, agg_fbc.hour,
                 agg_cr.date, agg_fb.date, agg_fbc.date
  `);
}

module.exports = hourlyMediaBuyerFacebookCrossroads;
