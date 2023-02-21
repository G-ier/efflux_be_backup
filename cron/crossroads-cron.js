const { CronJob } = require('cron');
const { todayYMD, yesterdayYMD, dayBeforeYesterdayYMD, someDaysAgoYMD} = require('../common/day');
const { updateCrossroadsData, getFinalInfo } = require('../services/crossroadsService');
const Rules = require('../constants/cron');
const { CROSSROADS_ACCOUNTS } = require('../constants/crossroads');
const { updateCR_ThreeDaySpreadsheet } = require('../controllers/spreadsheetController');

const disableCron = process.env.DISABLE_CRON === 'true'

const crossroadsFinalDataCron = new CronJob(
  Rules.CR_DAILY,
  (async () => {
    console.log(`Getting final Crossroads on request_date = ${dayBeforeYesterdayYMD()} data...`);
    await Promise.all(CROSSROADS_ACCOUNTS.map((account) => {
      const isFinal = getFinalInfo(account.key, dayBeforeYesterdayYMD())
      if(isFinal) return updateCrossroadsData(account, dayBeforeYesterdayYMD());
    }));

  }),
);

const crossroadsAfterMidnight = new CronJob(
  Rules.AFTER_MIDNIGHT,
  (async () => {
    console.log(`Getting after midnight Crossroads data...`);
    await Promise.all(CROSSROADS_ACCOUNTS.map((account) => {
        return updateCrossroadsData(account, yesterdayYMD());
    }));
  }),
);

const crossroadsHourlyCron = new CronJob(
  Rules.CR_HOURLY,
  (async () => {
    console.log(`Getting Crossroads data...`);
    await Promise.all(CROSSROADS_ACCOUNTS.map((account) => {
      return updateCrossroadsData(account, todayYMD());
    }))
  }),
);

const crossroadsSixMinCron = new CronJob(
  Rules.CR_REGULAR,
  (async () => {
    console.log(`Getting Crossroads data...`);
    await Promise.all(CROSSROADS_ACCOUNTS.map((account) => {
      return updateCrossroadsData(account, todayYMD());
    }))
  }),
);

const initializeCRCron = () => {
  (async () => {
    // for (let i = 0; i < 1; i++) {
    //   console.log(`Getting final Crossroads on request_date = ${someDaysAgoYMD(i + 1)} data...`);
    //   await Promise.all(
    //     CROSSROADS_ACCOUNTS.map((account) => {
    //       const isFinal = getFinalInfo(account.key, someDaysAgoYMD(i + 1));
    //       console.log(`${i}th is final? ${isFinal ? "yes" : "no"}`);
    //       if (isFinal) return updateCrossroadsData(account, someDaysAgoYMD(i + 1));
    //     })
    //   );
    // }
    await updateCR_ThreeDaySpreadsheet();
  })();

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
