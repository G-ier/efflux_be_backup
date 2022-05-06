const db = require('../../data/dbConfig');
const selects = require("./selects");

function hourlyGoogleCrossroadsByCampaignId(campaignId, startDate, endDate) {
  return db.raw(`
      WITH agg_cr AS (
        SELECT DISTINCT ON(cr.hour) cr.hour,
          ${selects.CROSSROADS}
        FROM crossroads cr
        WHERE  cr.date >  '${startDate}'
          AND  cr.date <= '${endDate}'
          AND campaign_id = '${campaignId}'
        GROUP BY  cr.hour
      ), agg_google AS (
        SELECT DISTINCT ON( google.hour ) google.hour,
          ${selects.GOOGLE}
        FROM google_ads google
        WHERE  google.date >  '${startDate}'
              AND  google.date <= '${endDate}'
              AND campaign_id = '${campaignId}'
        GROUP BY google.hour
      )
        SELECT agg_cr.hour, agg_google.hour as hour2,
          CAST(ROUND(SUM(agg_cr.revenue)::decimal, 2) AS FLOAT) as revenue,
          CAST(SUM(agg_cr.searches) AS INTEGER) as searches,
          CAST(SUM(agg_cr.lander_visits) AS INTEGER) as lander_visits,
          CAST(SUM(agg_cr.revenue_clicks) AS INTEGER) as revenue_clicks,
          CAST(SUM(agg_cr.visitors) AS INTEGER) as visitors,
          CAST(SUM(agg_cr.tracked_visitors) AS INTEGER) as tracked_visitors,
          SUM(agg_google.total_spent) as total_spent,
          CAST(SUM(agg_google.link_clicks) AS INTEGER) as link_clicks
        FROM agg_cr FULL OUTER JOIN agg_google USING(hour)
        GROUP BY agg_google.hour, agg_cr.hour
  `);
}

module.exports = hourlyGoogleCrossroadsByCampaignId;
