const {CronJob} = require('cron');
const Rules = require('../constants/cron');
const {
  updateSystem1Hourly,
  updateSystem1Daily
} = require('../services/system1Service');
const {updateS1_Spreadsheet} = require('../controllers/spreadsheetController');
const disableCron = process.env.DISABLE_CRON === 'true';

const updateSystem1DataHourlyJob = new CronJob(
  Rules.SYSTEM1_HOURLY,
  updateSystem1Hourly,
);

const updateSystem1DataDailyJob = new CronJob(
  Rules.SYSTEM1_DAILY,
  updateSystem1Daily,
);

const updateSystem1SheetJob = new CronJob(
  Rules.SHEET_REGULAR,
  updateS1_Spreadsheet,
);

function initializeSystem1Cron() {
  if (!disableCron) {
    updateSystem1DataHourlyJob.start();
    // updateSystem1DataDailyJob.start();
    updateSystem1SheetJob.start();
  }

  // Debug Code
  // updateSystem1Hourly().then(() => { console.log('SYSTEM1 HOURLY UPDATE DONE') });
  // updateSystem1Daily().then(() => { console.log('SYSTEM1 DAILY UPDATE DONE') });
  // updateSpreadsheet().then(() => { console.log('spreadsheet updated') });
}

module.exports = {initializeSystem1Cron};
