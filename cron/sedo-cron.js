const {CronJob} = require('cron');
const Rules = require('../constants/cron');
const {
  updateSedoDaily,
  updateSedoTodayDaily
} = require('../services/sedoService');
const {updateSedo_Conversion_Spreadsheet} = require('../controllers/spreadsheetController');
const disableCron = process.env.DISABLE_CRON === 'true';

const updateSedoDataDailyJob = new CronJob(
  Rules.SEDO_DAILY,
  updateSedoDaily,
);

const updateSedoTodayDataDailyJob = new CronJob(
  Rules.SEDO_HOURLY,
  updateSedoTodayDaily,
);

const updatePostbackSheetJob = new CronJob(
  Rules.SEDO_REGULAR,
  updateSedo_Conversion_Spreadsheet,
);

function initializeSedoCron() {

  (async () => {
    // console.log(`Getting Sedo data...`);
    // await updateSedoDaily()
    // console.log(`Done Fetching Sedo data...`);

    // await updateSedo_Conversion_Spreadsheet()
    // console.log(`DONE UPDATING SEDO SHEET...`);
  })();

  if (!disableCron) {
    updatePostbackSheetJob.start();
    updateSedoDataDailyJob.start();
    updateSedoTodayDataDailyJob.start();
  }

  // Debug Code
  // updateSystem1Hourly().then(() => { console.log('SYSTEM1 HOURLY UPDATE DONE') });
  // updateSystem1Daily().then(() => { console.log('SYSTEM1 DAILY UPDATE DONE') });
  // updateSpreadsheet().then(() => { console.log('spreadsheet updated') });
}

module.exports = {initializeSedoCron};
