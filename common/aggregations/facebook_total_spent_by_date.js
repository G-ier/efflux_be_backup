const db = require('../../data/dbConfig');

function aggregateFacebookAdsTodaySpentReport(date, accounts) {
  return db.raw(`
    SELECT CAST(ROUND(SUM(fb.total_spent)::decimal, 2) AS FLOAT) as amount_spent
    FROM facebook as fb    
    WHERE fb.date = '${date}' AND fb.ad_account_id = ANY('{${accounts}}')
  `);
}

module.exports = aggregateFacebookAdsTodaySpentReport;
