const { CronJob } = require('cron');
const Rules = require('../constants/cron');
const {updateCR_Spreadsheet, updateCR_ThreeDaySpreadsheet} = require('../controllers/spreadsheetController');

const disableCron = process.env.DISABLE_CRON === 'true'

const updateSheetJob = new CronJob(
  Rules.SHEET_REGULAR,
  updateCR_Spreadsheet,
);

const updateThreeDaySheetJob = new CronJob(
  Rules.SHEET_REGULAR,
  updateCR_ThreeDaySpreadsheet,
);

function initializeGoogleCron() {
  if (!disableCron) {
    updateSheetJob.start();
    updateThreeDaySheetJob.start();
  }

  // updateSpreadsheet().then(() => { console.log('DONE'); });
  // updateThreeDaySpreadsheet().then(() => { console.log('DONE'); });
  // updateStagingSheet().then(() => { console.log('DONE'); });
}

module.exports = { initializeGoogleCron };
