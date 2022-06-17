const db = require('../../data/dbConfig');
const { yesterdayYMD, dayBeforeYesterdayYMD} = require('./../day')
const {WHERE_BY_NETWORK} = require("./selects");

function aggregateFacebookAdsTodaySpentReport(date, accounts, network, timezone) {
  return db.raw(`
    SELECT CAST(ROUND(SUM(fb.total_spent)::decimal, 2) AS FLOAT) as amount_spent
    FROM facebook as fb    
    INNER JOIN campaigns c ON fb.campaign_id = c.id AND c.traffic_source = 'facebook'
      INNER JOIN ad_accounts ada ON ada.account_id = '20' AND fb.ad_account_id = ada.fb_account_id AND ada.fb_account_id = ANY('{${accounts}}')
    WHERE 
    ${WHERE_BY_NETWORK({network, startDate: yesterdayYMD(date, timezone), endDate: date, yestStartDate: dayBeforeYesterdayYMD(date, timezone), timezone})}      
    
  `);
}

module.exports = aggregateFacebookAdsTodaySpentReport;
