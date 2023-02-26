const { CronJob } = require('cron');
const { todayYMD, yesterdayYMD, dayBeforeYesterdayYMD, someDaysAgoYMD} = require('../common/day');
const { updateCrossroadsData, getFinalInfo } = require('../services/crossroadsService');
const Rules = require('../constants/cron');
const { CROSSROADS_ACCOUNTS } = require('../constants/crossroads');
const { updateCR_DaySpreadsheet } = require('../controllers/spreadsheetController');
const { sheetsArr } = require('../constants/crossroads');

const disableCron = process.env.DISABLE_CRON === 'true'

const updateCR_Sheet = async () => {
  for(let i=0;i<sheetsArr.length;i++) {
    await updateCR_DaySpreadsheet(sheetsArr[i]);
  }
}
const crossroadsFinalDataCron = new CronJob(
  Rules.CR_DAILY,
  (async () => {
    console.log(`Getting final Crossroads on request_date = ${dayBeforeYesterdayYMD()} data...`);
    await Promise.all(CROSSROADS_ACCOUNTS.map((account) => {
      const isFinal = getFinalInfo(account.key, dayBeforeYesterdayYMD())
      if(isFinal) return updateCrossroadsData(account, dayBeforeYesterdayYMD());
    }));
    updateCR_Sheet();
  }),
);

const crossroadsAfterMidnight = new CronJob(
  Rules.AFTER_MIDNIGHT,
  (async () => {
    console.log(`Getting after midnight Crossroads data...`);
    await Promise.all(CROSSROADS_ACCOUNTS.map((account) => {
        return updateCrossroadsData(account, yesterdayYMD());
    }));
    updateCR_Sheet();
  }),
);

const crossroadsHourlyCron = new CronJob(
  Rules.CR_HOURLY,
  (async () => {
    console.log(`Getting Crossroads data...`);
    await Promise.all(CROSSROADS_ACCOUNTS.map((account) => {
      return updateCrossroadsData(account, todayYMD());
    }))
    updateCR_Sheet();
  }),
);

const crossroadsSixMinCron = new CronJob(
  Rules.CR_REGULAR,
  (async () => {
    console.log(`Getting Crossroads data...`);
    await Promise.all(CROSSROADS_ACCOUNTS.map((account) => {
      return updateCrossroadsData(account, todayYMD());
    }))
    updateCR_Sheet();
  }),
);

const initializeCRCron = () => {
  // (async () => {

  //   // console.log(`Getting Crossroads data...`);
  //   // await Promise.all(CROSSROADS_ACCOUNTS.map((account) => {
  //   //   return updateCrossroadsData(account, someDaysAgoYMD(8));
  //   // }))

  //   // for(let i=0;i<sheetsArr.length;i++) {
  //   //   await updateCR_DaySpreadsheet(sheetsArr[i]);
  //   // }

  // })();

  if (!disableCron) {
    crossroadsFinalDataCron.start();
    crossroadsSixMinCron.start();
    crossroadsAfterMidnight.start();
    crossroadsHourlyCron.start();
  }
};

module.exports = {
  initializeCRCron,
};
