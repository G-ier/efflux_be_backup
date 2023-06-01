const db = require('../../../data/dbConfig');
const selects = require("../selects");

const facebookMediaNetByDate = (startDate, endDate) => {

  query = `
    WITH restriction AS (
      SELECT DISTINCT campaign_id
      FROM media_net_stats
      WHERE
        date > '${startDate}' AND date <= '${endDate}'
    ), agg_mn AS (
        SELECT
            date as mn_date,
            SUM(impressions) AS pbImpressions,
            SUM(total_clicks) AS total_clicks,
            SUM(estimated_revenue) AS revenue
        FROM
            media_net_stats
        WHERE
            date > '${startDate}' AND date <= '${endDate}'
        GROUP BY date
    ), agg_fb AS (
        SELECT
          fb.date as fb_date,
          MAX(fb.created_at) as fb_last_updated,
            ${selects.FACEBOOK}
          FROM facebook_partitioned fb
          WHERE  fb.date >  '${startDate}'
            AND  fb.date <= '${endDate}'
            AND fb.campaign_id IN (SELECT campaign_id FROM restriction)
          GROUP BY fb.date
    )
    SELECT
        (CASE
            WHEN agg_fb.fb_date IS NOT null THEN agg_fb.fb_date
            WHEN agg_mn.mn_date IS NOT null THEN agg_mn.mn_date
            ELSE null
        END) as date,
        SUM(agg_mn.pbImpressions) as pbImpressions,
        SUM(agg_mn.total_clicks) as total_clicks,
        SUM(agg_mn.revenue) as revenue,
        CAST(ROUND(SUM(agg_fb.spend)::decimal, 2) AS FLOAT) as spend,
        CAST(SUM(agg_fb.fb_conversions) AS INTEGER) as fb_conversions,
        CAST(SUM(agg_fb.link_clicks) AS INTEGER) as link_clicks,
        CAST(SUM(agg_fb.impressions) AS INTEGER) as impressions
      FROM agg_mn
        FULL OUTER JOIN agg_fb ON agg_fb.fb_date = agg_mn.mn_date
      GROUP BY agg_fb.fb_date, agg_mn.mn_date
      ORDER BY agg_mn.mn_date ASC;
  `
  // console.log("media.net dates by date", query);
  return db.raw(query);
}
module.exports = facebookMediaNetByDate;
