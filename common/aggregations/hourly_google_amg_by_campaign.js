const db = require('../../data/dbConfig');
const selects = require("./selects");

function hourlyGoogleAMGByCampaignId(campaignId, startDate, endDate) {
  return db.raw(`
      WITH agg_amg AS (
        SELECT DISTINCT ON(amg.hour) amg.hour,
          ${selects.AMG}
        FROM amg
        WHERE  amg.date >  '${startDate}'
          AND  amg.date <= '${endDate}'
          AND campaign_id = '${campaignId}'
        GROUP BY  amg.hour
      ), agg_google AS (
        SELECT DISTINCT ON( google.hour ) google.hour,
          ${selects.GOOGLE}
        FROM google_ads google
        WHERE  google.date >  '${startDate}'
              AND  google.date <= '${endDate}'
              AND campaign_id = '${campaignId}'
        GROUP BY google.hour
      )
        SELECT agg_amg.hour, agg_google.hour as hour2,
          CAST(ROUND(SUM(agg_amg.revenue)::decimal, 2) AS FLOAT) as revenue,
          CAST(SUM(amg.clicks) AS INTEGER) as revenue_clicks,
          CAST(SUM(amg.spam_clicks) AS INTEGER) as spam_clicks,
          CAST(SUM(amg.queries) AS INTEGER) as queries,
          CAST(SUM(amg.matched_queries) AS INTEGER) as matched_queries,
          CAST(SUM(amg.spam_queries) AS INTEGER) as spam_queries,
          CAST(SUM(amg.impressions) AS INTEGER) as impressions,
          CAST(SUM(amg.spam_impressions) AS INTEGER) as spam_impressions,
          SUM(agg_google.total_spent) as total_spent,
          CAST(SUM(agg_google.link_clicks) AS INTEGER) as link_clicks
        FROM agg_amg FULL OUTER JOIN agg_google USING(hour)
        GROUP BY agg_google.hour, agg_amg.hour
  `);
}

module.exports = hourlyGoogleAMGByCampaignId;
