const db = require('../../data/dbConfig');

function facebookByDate(date) {
  return db.raw(`
    SELECT fb.campaign_id,
           fb.ad_id,
           ROUND(SUM(fb.total_spent)::DECIMAL, 2) as total_spent,
           CAST(SUM(fb.link_clicks) AS INTEGER)   as link_clicks,
           CAST(SUM(fb.conversions) AS INTEGER) as conversions,
           CAST(SUM(fb.impressions) AS INTEGER) as impressions
    FROM facebook fb
    WHERE date = '${date}'
    GROUP BY campaign_id, ad_id
  `);
}

module.exports = facebookByDate;
