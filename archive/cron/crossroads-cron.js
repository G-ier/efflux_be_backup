const { CronJob } = require('cron');
const { todayYMD, yesterdayYMD, dayBeforeYesterdayYMD, someDaysAgoYMD} = require('../common/day');
const { updateCrossroadsData, getFinalInfo } = require('../services/crossroadsService');
const Rules = require('../constants/cron');
const { CROSSROADS_ACCOUNTS, todaySheetsArr, hourlySheetArr } = require('../constants/crossroads');
const { updateCR_DaySpreadsheet, updateCR_TodaySpreadsheet, updateCR_HourlySpreadsheet } = require('../controllers/spreadsheetController');
const { sheetsArr } = require('../constants/crossroads');
const { updateTablePartitions } = require('./helpers');

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

const crossroadsFinalYesterday = new CronJob(
  Rules.CR_DAILY2,
  (async () => {
    console.log(`Getting after midnight Crossroads data...`);
    await Promise.all(CROSSROADS_ACCOUNTS.map((account) => {
        return updateCrossroadsData(account, yesterdayYMD());
    }));
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

const updateCrossroadsPartitionsJob = new CronJob(
  Rules.PARTITIONS_DAILY,
  updateCrossroadsPartitions,
);

async function updateCrossroadsPartitions() {
  await updateTablePartitions('crossroads_partitioned')
}

const initializeCRCron = () => {
  if (!disableCron) {
    updateCrossroadsPartitionsJob.start();
    crossroadsFinalDataCron.start();
    crossroadsSixMinCron.start();
    crossroadsAfterMidnight.start();
    crossroadsFinalYesterday.start();
  }
};

module.exports = {
  initializeCRCron,
};
