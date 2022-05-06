const db = require('../../../data/dbConfig');
const {threeDaysAgoYMD} = require("../../day");
const selects = require("../selects");

const dailyCampaignFacebookCrossroads = (campaign_id, startDate, endDate) => db.raw(`
    WITH agg_cr AS (
      SELECT cr.request_date as date,
        ${selects.CROSSROADS}
      FROM crossroads_stats cr
      WHERE cr.request_date > '${startDate}'
        AND cr.request_date <= '${endDate}'
        AND cr.campaign_id = '${campaign_id}'
      GROUP BY cr.request_date
    ), agg_fb AS (
      SELECT fb.date,
        ${selects.FACEBOOK}
      FROM facebook fb
      WHERE
        fb.date > '${startDate}'
        AND fb.date <= '${endDate}'
        AND fb.campaign_id = '${campaign_id}'
      GROUP BY fb.date
    ), agg_fbc AS (
          SELECT fbc.date,
            ${selects.FACEBOOK_CONVERSIONS}
          FROM fb_conversions as fbc
          WHERE    fbc.date >  '${startDate}'
            AND    fbc.date <= '${endDate}'
            AND    fbc.campaign_id = '${campaign_id}'
          GROUP BY fbc.date
      )
    SELECT * FROM agg_cr
      FULL OUTER JOIN agg_fb USING (date)
      FULL OUTER JOIN agg_fbc USING (date)
    ORDER BY agg_fb.date ASC
  `);

module.exports = dailyCampaignFacebookCrossroads;
