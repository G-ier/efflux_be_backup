const {CronJob} = require('cron');
const Rules = require('../constants/cron');
const {
  updateSystem1Hourly,
  updateSystem1Daily
} = require('../services/system1Service');
const {updatePB_Spreadsheet} = require('../controllers/spreadsheetController');
const disableCron = process.env.DISABLE_CRON === 'true';

const updateSystem1DataHourlyJob = new CronJob(
  Rules.SYSTEM1_HOURLY,
  updateSystem1Hourly,
);

const updateSystem1DataDailyJob = new CronJob(
  Rules.SYSTEM1_DAILY,
  updateSystem1Daily,
);

const updatePostbackSheetJob = new CronJob(
  Rules.SHEET_REGULAR,
  updatePB_Spreadsheet,
);

function initializePostbackCron() {
  if (!disableCron) {    
    updatePostbackSheetJob.start();
  }

  // Debug Code
  // updateSystem1Hourly().then(() => { console.log('SYSTEM1 HOURLY UPDATE DONE') });
  // updateSystem1Daily().then(() => { console.log('SYSTEM1 DAILY UPDATE DONE') });
  // updateSpreadsheet().then(() => { console.log('spreadsheet updated') });
}

module.exports = {initializePostbackCron};
