const db = require("../../data/dbConfig");
const selects = require('./selects');

const facebookCrossroadByDate = (startDate, endDate) => {
  return db.raw(`
      WITH agg_s1 AS (
        SELECT s1.date,
          ${selects.SYSTEM1}
        FROM system1 s1
          INNER JOIN campaigns c on s1.campaign_id = c.id
          AND c.traffic_source = 'facebook'
          AND c.network = 'system1'
        WHERE  s1.date >  '${startDate}'
        AND   s1.date <= '${endDate}'
        GROUP BY  s1.date
      ), agg_fb AS (
          SELECT fb.date,
          ${selects.FACEBOOK}
          FROM facebook fb
          INNER JOIN campaigns c ON fb.campaign_id = c.id
            AND c.traffic_source = 'facebook'
            AND c.network = 'system1'
          WHERE  fb.date >  '${startDate}'
          AND  fb.date <= '${endDate}'
          GROUP BY fb.date
      ), agg_pb_s1 AS (
          SELECT DISTINCT ON(pb_s1.date) pb_s1.date,
            ${selects.PB_SYSTEM1}
          FROM s1_conversions as pb_s1
            INNER JOIN campaigns c ON pb_s1.campaign_id = c.id
                AND c.network = 'system1'
                AND c.traffic_source = 'facebook'
          WHERE pb_s1.date > '${startDate}' AND pb_s1.date <= '${endDate}'
          GROUP BY pb_s1.date
      )
      SELECT
        (CASE
            WHEN agg_fb.date IS NOT null THEN agg_fb.date
            WHEN agg_s1.date IS NOT null THEN agg_s1.date
            WHEN agg_pb_s1.date IS NOT null THEN agg_pb_s1.date
            ELSE null
        END) as date,
        ${selects.FACEBOOK_SYSTEM1}
      FROM agg_s1
        FULL OUTER JOIN agg_fb USING (date)
        FULL OUTER JOIN agg_pb_s1 USING (date)
      GROUP BY agg_fb.date, agg_pb_s1.date, agg_s1.date
      ORDER BY agg_fb.date ASC
  `);
};

module.exports = facebookCrossroadByDate;
