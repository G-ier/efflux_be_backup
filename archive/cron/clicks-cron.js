const { CronJob } = require('cron');
const moment = require('moment');
const spreadsheets = require('../services/spreadsheetService');
const { clicksReport } = require('../common/aggregations');

const spreadsheetId = process.env.SPREADSHEET_ID;
const sheetName = process.env.CLICKS_SHEET_NAME;

async function updateSpreadsheet(date) {
  const clicks = await clicksReport(date);
  await spreadsheets.updateSpreadsheet(clicks, spreadsheetId, sheetName)
}

function initializeClicksCron() {
  updateSpreadsheet(moment().subtract(1, 'day')).then(() => { console.log('DONE'); });
}

module.exports = { initializeClicksCron };
