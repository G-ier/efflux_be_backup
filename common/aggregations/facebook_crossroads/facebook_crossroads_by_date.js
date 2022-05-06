const db = require("../../../data/dbConfig");
const selects = require('../selects');

const facebookCrossroadsByDate = (startDate, endDate) => {
  return db.raw(`
      WITH agg_cr AS (
        SELECT cr.request_date as date,
        MAX(cr.created_at) as cr_last_updated,
        ${selects.CROSSROADS}
        FROM crossroads_stats cr
          WHERE  cr.request_date >  '${startDate}'
          AND   cr.request_date <= '${endDate}'
          AND cr.traffic_source = 'facebook'
        GROUP BY  cr.request_date
      ), agg_fb AS (
          SELECT fb.date,
          MAX(fb.created_at) as fb_last_updated,
          ${selects.FACEBOOK}
          FROM facebook fb
          INNER JOIN campaigns c ON fb.campaign_id = c.id
            AND c.traffic_source = 'facebook'
            AND c.network = 'crossroads'
          WHERE  fb.date >  '${startDate}'
          AND  fb.date <= '${endDate}'
          GROUP BY fb.date
      ), agg_fbc AS (
            SELECT fbc.date,
            ${selects.FACEBOOK_CONVERSIONS}
          FROM fb_conversions as fbc
            INNER JOIN campaigns c ON fbc.campaign_id = c.id AND c.network = 'crossroads' AND c.traffic_source = 'facebook'
          WHERE fbc.date > '${startDate}' AND fbc.date <= '${endDate}'
          GROUP BY fbc.date
      )
      SELECT
        (CASE
            WHEN agg_fb.date IS NOT null THEN agg_fb.date
            WHEN agg_cr.date IS NOT null THEN agg_cr.date
            WHEN agg_fbc.date IS NOT null THEN agg_fbc.date
            ELSE null
        END) as date,
        MAX(fb_last_updated) as fb_last_updated,
        MAX(cr_last_updated) as cr_last_updated,
        ${selects.FACEBOOK_CROSSROADS}
      FROM agg_cr
        FULL OUTER JOIN agg_fb USING (date)
        FULL OUTER JOIN agg_fbc USING (date)
      GROUP BY agg_fb.date, agg_fbc.date, agg_cr.date
      ORDER BY date ASC
  `);
};

module.exports = facebookCrossroadsByDate;
