const db = require('../../data/dbConfig');
const selects = require('./selects');

function hourlyAMGByCampaignId(campaignId, startDate, endDate) {
  return db.raw(`
      WITH agg_amg AS (
        SELECT DISTINCT ON(amg.hour) amg.hour,
          ${selects.AMG}
        FROM amg
        WHERE  amg.date >  '${startDate}'
          AND  amg.date <= '${endDate}'
          AND campaign_id = '${campaignId}'
        GROUP BY  amg.hour
      ), agg_fb AS (
        SELECT DISTINCT ON( fb.hour ) fb.hour,
          ${selects.FACEBOOK}
        FROM facebook fb
        WHERE  fb.date >  '${startDate}'
              AND  fb.date <= '${endDate}'
              AND campaign_id = '${campaignId}'
        GROUP BY fb.hour
      )
        SELECT agg_amg.hour, agg_fb.hour as hour2,
          CAST(ROUND(SUM(agg_amg.revenue)::decimal, 2) AS FLOAT) as revenue,
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
          CAST(SUM(agg_fb.impressions) AS INTEGER) as impressions
        FROM agg_amg FULL OUTER JOIN agg_fb USING(hour)
        GROUP BY agg_fb.hour, agg_amg.hour
  `);
}

module.exports = hourlyAMGByCampaignId;
