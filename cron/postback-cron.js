const {CronJob} = require('cron');
const Rules = require('../constants/cron');
const {
} = require('../services/system1Service');
const {updatePB_Spreadsheet, updateYesterdayPB_Spreadsheet} = require('../controllers/spreadsheetController');
const disableCron = process.env.DISABLE_CRON === 'true';

const updatePostbackSheetJob = new CronJob(
  Rules.EVERY_TEN_MINUTES,
  updatePB_Spreadsheet,
);

const updateYesterdayPostbackSheetJob = new CronJob(
  Rules.SHEET_REGULAR,
  updateYesterdayPB_Spreadsheet,
);

function initializePostbackCron() {
  
  if (!disableCron) {    
    updatePostbackSheetJob.start();
    updateYesterdayPostbackSheetJob.start();
  }

  // Debug Code
  // updateSystem1Hourly().then(() => { console.log('SYSTEM1 HOURLY UPDATE DONE') });
  // updateSystem1Daily().then(() => { console.log('SYSTEM1 DAILY UPDATE DONE') });
  // updateSpreadsheet().then(() => { console.log('spreadsheet updated') });
}

module.exports = {initializePostbackCron};
