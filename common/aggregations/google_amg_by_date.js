const db = require("../../data/dbConfig");
const selects = require("./selects");

const googleAMGByDate = (startDate, endDate) => {
  return db.raw(`
      WITH agg_amg AS (
        SELECT DISTINCT ON(amg.date) amg.date,
          ${selects.AMG}
        FROM amg
            INNER JOIN campaigns c ON amg.campaign_id = c.id
                AND c.traffic_source = 'google'
                AND c.network = 'amg'
        WHERE  amg.date >  '${startDate}'
        AND   amg.date <= '${endDate}'
        GROUP BY  amg.date
      ), agg_google AS (
        SELECT DISTINCT ON(google.date) google.date,
        ${selects.GOOGLE}
        FROM google_ads google
            INNER JOIN campaigns c ON google.campaign_id = c.id
                AND c.traffic_source = 'google'
                AND c.network = 'amg'
          WHERE  google.date >  '${startDate}'
          AND  google.date <= '${endDate}'
          GROUP BY google.date
      )
      SELECT
        CAST(SUM(agg_amg.revenue) AS FLOAT) as revenue,
        CAST(SUM(agg_amg.revenue_clicks) AS INTEGER) as revenue_clicks,
        CAST(SUM(agg_amg.spam_clicks) AS INTEGER) as spam_clicks,
        CAST(SUM(agg_amg.queries) AS INTEGER) as queries,
        CAST(SUM(agg_amg.matched_queries) AS INTEGER) as matched_queries,
        CAST(SUM(agg_amg.spam_queries) AS INTEGER) as spam_queries,
        CAST(SUM(agg_amg.impressions) AS INTEGER) as impressions,
        CAST(SUM(agg_amg.spam_impressions) AS INTEGER) as spam_impressions,
        SUM(agg_google.total_spent) as total_spent,
        CAST(SUM(agg_google.link_clicks) AS INTEGER) as link_clicks,
        agg_amg.date
      FROM agg_amg FULL OUTER JOIN agg_google USING (date)
      GROUP BY agg_amg.date, agg_google.date
      ORDER BY agg_amg.date ASC
  `);
};

module.exports = googleAMGByDate;
