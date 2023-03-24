const {
  aggregateSystem1ConversionReport,
} = require('../common/aggregations/system1_conversion_report');

const {
  calculateValuesForSpreadsheet,
} = require('../../controllers/spreadsheetController');

async function updateS1_Spreadsheet() {
  const spreadsheetId = process.env.SEDO_SPREADSHEET_ID;
  const sheetName = process.env.PB_SYSTEM1_SHEET_NAME;
  const sheetNameByAdset = process.env.PB_SYSTEM1_SHEET_BY_ADSET;

  let todayData = await aggregateSystem1ConversionReport(yesterdayYMD(null, 'UTC'), todayYMD('UTC'), 'campaign_id');
  todayData = calculateValuesForSpreadsheet(todayData.rows, ['campaign_id', 'campaign_name', ...SYSTEM1_SHEET_VALUES])
  await spreadsheets.updateSpreadsheet(todayData, {spreadsheetId, sheetName});

  let todayDataByAdset = await aggregateSystem1ConversionReport(yesterdayYMD(null, 'UTC'), todayYMD('UTC'), 'adset_id');
  todayDataByAdset = calculateValuesForSpreadsheet(todayDataByAdset.rows, ['adset_id', 'campaign_name', ...SYSTEM1_SHEET_VALUES])
  await spreadsheets.updateSpreadsheet(todayDataByAdset, {spreadsheetId, sheetName: sheetNameByAdset});
}

module.exports = {
  updateS1_Spreadsheet,
};
