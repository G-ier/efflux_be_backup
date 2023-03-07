const { CronJob } = require('cron');
const { todayYMD, yesterdayYMD, dayBeforeYesterdayYMD, someDaysAgoYMD} = require('../common/day');
const { updateCrossroadsData, getFinalInfo } = require('../services/crossroadsService');
const Rules = require('../constants/cron');
const { CROSSROADS_ACCOUNTS, todaySheetsArr, hourlySheetArr } = require('../constants/crossroads');
const { updateCR_DaySpreadsheet, updateCR_TodaySpreadsheet, updateCR_HourlySpreadsheet } = require('../controllers/spreadsheetController');
const { sheetsArr } = require('../constants/crossroads');

const disableCron = process.env.DISABLE_CRON === 'true'

const updateCR_Sheet = async () => {
  sheetsArr.forEach(async (sheet) => {
    await updateCR_DaySpreadsheet(sheet)
  })
  todaySheetsArr.forEach(async (sheet) => {
    await updateCR_TodaySpreadsheet(sheet);
  })
  hourlySheetArr.forEach(async (sheet) => {
    await updateCR_HourlySpreadsheet(sheet);
  })
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

const crossroadsFinalYesterday = new CronJob(
  Rules.CR_DAILY2,
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
  (async () => {

    // console.log(`Getting Crossroads data...`);
    // await Promise.all(CROSSROADS_ACCOUNTS.map((account) => {
    //   return updateCrossroadsData(account, someDaysAgoYMD(8));
    // }))

    hourlySheetArr.forEach(async (sheet) => {
      await updateCR_HourlySpreadsheet(sheet);
    })
    // console.log(`Done Updating Today's Crossroads data...`);


  })();

  if (!disableCron) {
    crossroadsFinalDataCron.start();
    crossroadsSixMinCron.start();
    crossroadsAfterMidnight.start();
    crossroadsFinalYesterday.start();
    crossroadsHourlyCron.start();
  }
};

module.exports = {
  initializeCRCron,
};
