const db = require('../../data/dbConfig');

function amgByDate(date) {
  return db.raw(`
    SELECT campaign_id,
           SUM(revenue)          as total_revenue,
           SUM(clicks)           as total_clicks,
           SUM(spam_clicks)      as total_spam_clicks,
           SUM(queries)          as total_queries,
           SUM(matched_queries)  as total_matched_queries,
           SUM(spam_queries)     as total_spam_queries,
           SUM(impressions)      as total_impressions,
           SUM(spam_impressions) as total_spam_impressions
    FROM amg
    WHERE date = '${date}'
    GROUP BY campaign_id
  `);
}

module.exports = amgByDate;
