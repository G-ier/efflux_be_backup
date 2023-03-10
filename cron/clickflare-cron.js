const { CronJob } = require('cron');
const { todayYMD, yesterdayYMD, dayBeforeYesterdayYMD, someDaysAgoYMD} = require('../common/day');
const { updateCrossroadsData, getFinalInfo } = require('../services/crossroadsService');
const Rules = require('../constants/cron');
const { CROSSROADS_ACCOUNTS, todaySheetsArr } = require('../constants/crossroads');
const { updateCR_DaySpreadsheet, updateCR_TodaySpreadsheet } = require('../controllers/spreadsheetController');
const { sheetsArr } = require('../constants/crossroads');

const disableCron = process.env.DISABLE_CRON === 'true'

const crossroadsHourlyCron = new CronJob(
  Rules.CR_DAILY,
  (async () => {

    await Promise.all(CROSSROADS_ACCOUNTS.map((account) => {
      const isFinal = getFinalInfo(account.key, dayBeforeYesterdayYMD())
      if(isFinal) return updateCrossroadsData(account, dayBeforeYesterdayYMD());
    }));
    updateCR_Sheet();
  }),
);


const initializeCFCron = () => {
  (async () => {

  })();

  if (!disableCron) {
    crossroadsHourlyCron.start();
  }
};

module.exports = {
  initializeCFCron,
};
