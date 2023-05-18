const db = require("../../data/dbConfig");
const selects = require('./selects');

const facebookSystem1ByDate = (startDate, endDate) => {
  query = `
  WITH agg_s1 AS (
    SELECT s1.date as s1_date,
      ${selects.SYSTEM1}
    FROM system1_partitioned s1
      INNER JOIN campaigns c on s1.campaign_id = c.id
      AND c.traffic_source = 'facebook'
      --AND c.network = 'system1'
    WHERE  s1.date >  '${startDate}'
    AND   s1.date <= '${endDate}'
    GROUP BY  s1.date
  ), agg_fb AS (
      SELECT fb.date as fb_date,
      ${selects.FACEBOOK}
      FROM facebook_partitioned fb
      INNER JOIN campaigns c ON fb.campaign_id = c.id
        AND c.traffic_source = 'facebook'
        --AND c.network = 'system1'
      WHERE  fb.date >  '${startDate}'
      AND  fb.date <= '${endDate}'
      GROUP BY fb.date
  ), agg_pb_s1 AS (
      SELECT DISTINCT ON(pb_s1.date) pb_s1.date as pb_s1_date,
        ${selects.PB_SYSTEM1}
      FROM s1_conversions_partitioned as pb_s1
        INNER JOIN campaigns c ON pb_s1.campaign_id = c.id
            --AND c.network = 'system1'
            AND c.traffic_source = 'facebook'
      WHERE pb_s1.date > '${startDate}' AND pb_s1.date <= '${endDate}'
      GROUP BY pb_s1.date
  )
  SELECT
    (CASE
        WHEN agg_fb.fb_date IS NOT null THEN agg_fb.fb_date
        WHEN agg_s1.s1_date IS NOT null THEN agg_s1.s1_date
        WHEN agg_pb_s1.pb_s1_date IS NOT null THEN agg_pb_s1.pb_s1_date
        ELSE null
    END) as date,
    ${selects.FACEBOOK_SYSTEM1}
  FROM agg_s1
    FULL OUTER JOIN agg_fb ON agg_s1.s1_date = agg_fb.fb_date
    FULL OUTER JOIN agg_pb_s1 ON agg_s1.s1_date = agg_pb_s1.pb_s1_date
  GROUP BY agg_fb.fb_date, agg_pb_s1.pb_s1_date, agg_s1.s1_date
  ORDER BY agg_fb.fb_date ASC
  `
  // console.log("facebook system1 by Date", query)
  return db.raw(query);
};

module.exports = facebookSystem1ByDate;
