const db = require('../../data/dbConfig');

function googleByDate(date) {
  return db.raw(`
    SELECT gdn.campaign_id,
           ROUND(SUM(gdn.total_spent)::DECIMAL, 2) as total_spent,
           CAST(SUM(gdn.link_clicks) AS INTEGER)   as link_clicks
    FROM google_ads gdn
    WHERE date = '${date}'
    GROUP BY campaign_id
  `);
}

module.exports = googleByDate;
