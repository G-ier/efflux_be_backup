const db = require('../../data/dbConfig');

function aggregateFacebookAdsTodaySpentReport(date) {
  return db.raw(`
    SELECT CAST(ROUND(SUM(ac.today_spent)::decimal, 2) AS FLOAT) as amount_spent
    FROM ad_accounts as ac
    WHERE ac.date_start = '${date}' and ac.network = 'system1'
    GROUP BY ac.network
  `);
}

module.exports = aggregateFacebookAdsTodaySpentReport;
