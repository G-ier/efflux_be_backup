const db = require('../../data/dbConfig');
const selects = require("./selects");

function hourlySystem1ByCampaignId(campaignId, startDate, endDate) {
  return db.raw(`
      WITH agg_s1 AS (
        SELECT DISTINCT ON(s1.hour) s1.hour,
          ${selects.SYSTEM1}
        FROM system1 s1
        WHERE  s1.date >  '${startDate}'
          AND  s1.date <= '${endDate}'
          AND campaign_id = '${campaignId}'
        GROUP BY  s1.hour
      ), agg_fb AS (
        SELECT DISTINCT ON( fb.hour ) fb.hour,
          ${selects.SYSTEM1}
        FROM facebook fb
        WHERE  fb.date >  '${startDate}'
              AND  fb.date <= '${endDate}'
              AND campaign_id = '${campaignId}'
        GROUP BY fb.hour
      ), agg_pb_s1 AS (
          SELECT DISTINCT ON(pb_s1.hour) pb_s1.hour,
            ${selects.PB_SYSTEM1}
          FROM s1_conversions as pb_s1
            INNER JOIN campaigns c ON pb_s1.campaign_id = c.id AND c.network = 'system1' AND c.traffic_source = 'facebook'
          WHERE pb_s1.date > '${startDate}'
                AND pb_s1.date <= '${endDate}'
                AND campaign_id = '${campaignId}'
          GROUP BY pb_s1.hour
      )
        SELECT
          (CASE
            WHEN agg_fb.hour IS NOT null THEN agg_fb.hour
            WHEN agg_s1.hour IS NOT null THEN agg_s1.hour
            WHEN agg_pb_s1.hour IS NOT null THEN agg_pb_s1.hour
            ELSE null
          END) as hour,
          ${selects.FACEBOOK_SYSTEM1}
        FROM agg_s1
            FULL OUTER JOIN agg_fb USING(hour)
            FULL OUTER JOIN agg_pb_s1 USING(hour)
        GROUP BY agg_fb.hour, agg_s1.hour, agg_pb_s1.hour
  `);
}

module.exports = hourlySystem1ByCampaignId;
