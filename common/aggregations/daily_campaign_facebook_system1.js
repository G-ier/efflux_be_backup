const db = require('../../data/dbConfig');
const selects = require("./selects");

const dailyCampaignFacebookSystem1 = (campaign_id, startDate, endDate) => db.raw(`
    WITH agg_s1 AS (
      SELECT DISTINCT ON(s1.date) s1.date,
        ${selects.SYSTEM1}
      FROM system1 s1
      WHERE s1.date > '${startDate}'
        AND s1.date <= '${endDate}'
        AND s1.campaign_id = '${campaign_id}'
      GROUP BY s1.date
    ), agg_fb AS (
      SELECT DISTINCT ON(fb.date) fb.date,
        ${selects.FACEBOOK}
      FROM facebook fb
      WHERE
        fb.date > '${startDate}'
        AND fb.date <= '${endDate}'
        AND fb.campaign_id = '${campaign_id}'
      GROUP BY fb.date
    ), agg_pb_s1 AS (
      SELECT DISTINCT ON(pb_s1.date) pb_s1.date,
         ${selects.PB_SYSTEM1}
      FROM s1_conversions as pb_s1
      WHERE    pb_s1.date >  '${startDate}'
        AND    pb_s1.date <= '${endDate}'
        AND    pb_s1.campaign_id = '${campaign_id}'
      GROUP BY pb_s1.date
      )
    SELECT * FROM agg_s1
      FULL OUTER JOIN agg_fb USING (date)
      FULL OUTER JOIN agg_pb_s1 USING (date)
    ORDER BY agg_fb.date ASC
  `);

module.exports = dailyCampaignFacebookSystem1;
