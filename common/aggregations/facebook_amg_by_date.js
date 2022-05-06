const db = require("../../data/dbConfig");
const selects = require('./selects');

const facebookAMGByDate = (startDate, endDate) => {
  return db.raw(`
      WITH agg_amg AS (
        SELECT amg.date,
          ${selects.AMG}
        FROM amg
            INNER JOIN campaigns c on amg.campaign_id = c.id
            AND c.traffic_source = 'facebook'
            AND c.network = 'amg'
        WHERE  amg.date >  '${startDate}'
        AND   amg.date <= '${endDate}'
        GROUP BY  amg.date
      ), agg_fb AS (
          SELECT fb.date,
            ${selects.FACEBOOK}
          FROM facebook fb
          INNER JOIN campaigns c ON fb.campaign_id = c.id
            AND c.traffic_source = 'facebook'
            AND c.network = 'amg'
          WHERE  fb.date >  '${startDate}'
          AND  fb.date <= '${endDate}'
          GROUP BY fb.date
      )
      SELECT
        (CASE
          WHEN agg_fb.date IS NOT null THEN agg_fb.date
          WHEN agg_amg.date IS NOT null THEN agg_amg.date
        END) as date,
        CAST(SUM(agg_amg.revenue) AS FLOAT) as revenue,
        CAST(SUM(agg_amg.revenue_clicks) AS INTEGER) as revenue_clicks,
        CAST(SUM(agg_amg.spam_clicks) AS INTEGER) as spam_clicks,
        CAST(SUM(agg_amg.queries) AS INTEGER) as queries,
        CAST(SUM(agg_amg.matched_queries) AS INTEGER) as matched_queries,
        CAST(SUM(agg_amg.spam_queries) AS INTEGER) as spam_queries,
        CAST(SUM(agg_amg.impressions) AS INTEGER) as impressions,
        CAST(SUM(agg_amg.spam_impressions) AS INTEGER) as spam_impressions,
        SUM(agg_fb.total_spent) as total_spent,
        CAST(SUM(agg_fb.link_clicks) AS INTEGER) as link_clicks,
        CAST(SUM(agg_fb.ts_conversions) AS INTEGER) as ts_conversions,
        CAST(SUM(agg_fb.impressions) AS INTEGER) as impressions,
      FROM agg_amg FULL OUTER JOIN agg_fb USING (date)
      GROUP BY agg_amg.date, agg_fb.date
      ORDER BY date ASC
  `);
};

module.exports = facebookAMGByDate;
