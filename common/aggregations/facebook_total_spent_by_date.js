const db = require('../../data/dbConfig');
const {tomorrowYMD, yesterdayYMD} = require('./../day')
function aggregateFacebookAdsTodaySpentReport(date, accounts) {
  return db.raw(`
    SELECT CAST(ROUND(SUM(fb.total_spent)::decimal, 2) AS FLOAT) as amount_spent
    FROM facebook as fb    
    INNER JOIN campaigns c ON fb.campaign_id = c.id AND c.traffic_source = 'facebook'
      INNER JOIN ad_accounts ada ON ada.account_id = '20' AND fb.ad_account_id = ada.fb_account_id AND ada.fb_account_id = ANY('{${accounts}}')
    WHERE 
      ada.tz_offset >= 0 AND fb.date = '${date}' AND fb.hour >=ada.tz_offset  AND c.network = 'system1' OR
      ada.tz_offset >= 0 AND fb.date = '${tomorrowYMD(date, 'UTC')}' AND fb.hour < ada.tz_offset AND c.network = 'system1'  OR
      ada.tz_offset < 0 AND fb.date = '${date}' AND fb.hour <= 23-ada.tz_offset AND c.network = 'system1'  OR
      ada.tz_offset < 0 AND fb.date = '${yesterdayYMD(date, 'UTC')}' AND fb.hour > 23-ada.tz_offset AND c.network = 'system1' OR
      c.network != 'system1' AND fb.date = '${date}'
    
  `);
}

module.exports = aggregateFacebookAdsTodaySpentReport;
