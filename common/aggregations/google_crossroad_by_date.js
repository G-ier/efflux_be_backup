const db = require("../../data/dbConfig");
const selects = require("./selects");

const googleCrossroadsByDate = (startDate, endDate) => {
  return db.raw(`
      WITH agg_cr AS (
        SELECT DISTINCT ON(cr.date) cr.date,
        ${selects.CROSSROADS}
        FROM crossroads cr
            INNER JOIN campaigns c ON cr.campaign_id = c.id
                AND c.traffic_source = 'google'
                AND c.network = 'crossroads'
        WHERE  cr.date >  '${startDate}'
        AND   cr.date <= '${endDate}'
        GROUP BY  cr.date
      ), agg_google AS (
        SELECT DISTINCT ON( google.date) google.date,
        ${selects.GOOGLE}
        FROM google_ads google
            INNER JOIN campaigns c ON google.campaign_id = c.id
                AND c.traffic_source = 'google'
                AND c.network = 'crossroads'
          WHERE  google.date >  '${startDate}'
          AND  google.date <= '${endDate}'
          GROUP BY google.date
      )
      SELECT CAST(SUM(agg_cr.revenue) AS FLOAT) as revenue,
      CAST(SUM(agg_cr.searches) AS INTEGER) as searches,
      CAST(SUM(agg_cr.lander_visits) AS INTEGER) as lander_visits,
      CAST(SUM(agg_cr.revenue_clicks) AS INTEGER) as revenue_clicks,
      CAST(SUM(agg_cr.visitors) AS INTEGER) as visitors,
      CAST(SUM(agg_cr.tracked_visitors) AS INTEGER) as tracked_visitors,
      SUM(agg_google.total_spent) as total_spent,
      CAST(SUM(agg_google.link_clicks) AS INTEGER) as link_clicks,
      agg_cr.date
      FROM agg_cr FULL OUTER JOIN agg_google USING (date)
      GROUP BY agg_cr.date, agg_google.date
      ORDER BY agg_cr.date ASC
  `);
};

module.exports = googleCrossroadsByDate;
