const { CronJob } = require('cron');
const Rules = require('../constants/cron');
const { updateAMGData, getAMGData} = require('../services/amgService');
const { aggregateAMGConversions } = require("../common/aggregations");
const spreadsheets = require("../services/spreadsheetService");

const disableCron = process.env.DISABLE_CRON === 'true'
const spreadsheetId = process.env.AMG_SPREADSHEET_ID;
const sheetName = process.env.AMG_SHEET_NAME;

// let lastEmailId = null;

async function updateAMG() {
  const { data, date } = await getAMGData()
  await updateAMGData(data, date);
}

async function updateSpreadsheet() {
  const facebookAmgPostbackConversions = await aggregateAMGConversions();
  await spreadsheets.updateSpreadsheet(facebookAmgPostbackConversions, { spreadsheetId, sheetName });
}

const updateAMGDataJob = new CronJob(
  Rules.AMG_REGULAR,
  updateAMG,
);

const updateAMGSheetJob = new CronJob(
  Rules.SHEET_REGULAR,
  updateSpreadsheet,
);

function initializeAMGCron() {
  if (!disableCron) {
    updateAMGDataJob.start();
    updateAMGSheetJob.start();
  }

  // Debug Code
  // updateAMG().then(() => { console.log('AMG UPDATE DONE'); });
  // updateSpreadsheet().then(() => { console.log('spreadsheet updated') });
}

module.exports = { initializeAMGCron };
