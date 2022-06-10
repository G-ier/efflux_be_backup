const {CronJob} = require('cron');
const Rules = require('../constants/cron');
const {
  updateSedoDaily,
  updateSedoTodayDaily
} = require('../services/sedoService');
const {updateSedo_Spreadsheet} = require('../controllers/spreadsheetController');
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
  updateSedo_Spreadsheet,
);

function initializeSedoCron() {     
  // updateSedoTodayDaily()
  // updateSedoDaily()
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
