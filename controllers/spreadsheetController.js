const {
  aggregateCRConversions, aggregateOBConversionReport, aggregateSystem1ConversionReport,
  aggregatePRConversionReport, aggregateSedoConversionReport
} = require("../common/aggregations");
const {yesterdayYMD, todayYMD, fourDaysAgoYMD} = require("../common/day");
const spreadsheets = require("../services/spreadsheetService");
const {updateSpreadsheet} = require("../services/spreadsheetService");
const MetricsCalculator = require('../utils/metricsCalculator')

const {CROSSROADS_SHEET_VALUES} = require('../constants/crossroads')
const {SYSTEM1_SHEET_VALUES} = require('../constants/system1')

function preferredOrder(obj, order) {
  let newObject = {};
  for(let i = 0; i < order.length; i++) {
    newObject[order[i]] = obj[order[i]];
  }
  return newObject;
}

function calculateValuesForSpreadsheet(data, columns) {
  return {
    columns,
    rows: data.map(item => {
      const calcResult = new MetricsCalculator(item)
      const result = {
        ...calcResult,
        rpi: calcResult.rpi,
        cpa: calcResult.cpa,
        facebook_ctr: calcResult.facebook_ctr,
        live_ctr: calcResult.live_ctr,
        est_revenue: calcResult.est_revenue,
        roi: calcResult.roi,
        est_roi: calcResult.est_roi,
        profit: calcResult.profit,
        cpm: calcResult.cpm,
        rpm: calcResult.rpm,
        est_profit: calcResult.est_profit,
        rpc: calcResult.rpc,
        live_cpa: calcResult.live_cpa,
        cpc: calcResult.cpc,
        unique_cpa: calcResult.unique_cpa,
        unique_rpc: calcResult.unique_rpc,
      }
      return preferredOrder(result, columns)
    })
  }
}

async function updateCR_Spreadsheet() {
  const spreadsheetId = process.env.CR_SPREADSHEET_ID;
  const sheetName = process.env.CR_SHEET_NAME;
  const sheetNameByAdset = process.env.CR_SHEET_BY_ADSET;

  let oneDayFacebookPostbackConversions = await aggregateCRConversions(yesterdayYMD(), todayYMD(), 'campaign_id');
  oneDayFacebookPostbackConversions = calculateValuesForSpreadsheet(oneDayFacebookPostbackConversions.rows, ['campaign_id', 'campaign_name', ...CROSSROADS_SHEET_VALUES]);

  await spreadsheets.updateSpreadsheet(oneDayFacebookPostbackConversions, {spreadsheetId, sheetName});

  let oneDayFacebookPostbackConversionsByAdset = await aggregateCRConversions(yesterdayYMD(), todayYMD(), 'adset_id');
  oneDayFacebookPostbackConversionsByAdset = calculateValuesForSpreadsheet(oneDayFacebookPostbackConversionsByAdset.rows, ['adset_id', 'campaign_name', ...CROSSROADS_SHEET_VALUES]);

  await spreadsheets.updateSpreadsheet(oneDayFacebookPostbackConversionsByAdset, {
    spreadsheetId,
    sheetName: sheetNameByAdset
  });
}

async function updateCR_ThreeDaySpreadsheet() {
  const spreadsheetId = process.env.CR_THREE_DAY_SPREADSHEET_ID;
  const sheetName = process.env.CR_THREE_DAY_SHEET_NAME;
  const sheetNameByAdset = process.env.CR_THREE_DAY_SHEET_BY_ADSET;

  let threeDayFacebookPostbackConversions = await aggregateCRConversions(fourDaysAgoYMD(), yesterdayYMD(), 'campaign_id');
  threeDayFacebookPostbackConversions = calculateValuesForSpreadsheet(threeDayFacebookPostbackConversions.rows, ['campaign_id', 'campaign_name', ...CROSSROADS_SHEET_VALUES]);
  await spreadsheets.updateSpreadsheet(threeDayFacebookPostbackConversions, {spreadsheetId, sheetName});

  let threeDayFacebookPostbackConversionsByAdset = await aggregateCRConversions(fourDaysAgoYMD(), yesterdayYMD(), 'adset_id');
  threeDayFacebookPostbackConversionsByAdset = calculateValuesForSpreadsheet(threeDayFacebookPostbackConversionsByAdset.rows, ['adset_id', 'campaign_name', ...CROSSROADS_SHEET_VALUES]);
  await spreadsheets.updateSpreadsheet(threeDayFacebookPostbackConversionsByAdset, {
    spreadsheetId,
    sheetName: sheetNameByAdset
  });
}

async function updateOB_Spreadsheet() {
  const spreadsheetId = process.env.OB_SPREADSHEET_ID;
  const sheetName = process.env.OB_SHEET_NAME;

  const data = await aggregateOBConversionReport(yesterdayYMD(), todayYMD());
  await spreadsheets.updateSpreadsheet(data, {spreadsheetId, sheetName});
}

async function updateS1_Spreadsheet() {
  const spreadsheetId = process.env.SYSTEM1_SPREADSHEET_ID;
  const sheetName = process.env.SYSTEM1_SHEET_NAME;
  const sheetNameByAdset = process.env.SYSTEM1_SHEET_BY_ADSET;

  let todayData = await aggregateSystem1ConversionReport(yesterdayYMD(null, 'UTC'), todayYMD('UTC'), 'campaign_id');
  todayData = calculateValuesForSpreadsheet(todayData.rows, ['campaign_id', 'campaign_name', ...SYSTEM1_SHEET_VALUES])
  await spreadsheets.updateSpreadsheet(todayData, {spreadsheetId, sheetName});

  let todayDataByAdset = await aggregateSystem1ConversionReport(yesterdayYMD(null, 'UTC'), todayYMD('UTC'), 'adset_id');
  todayDataByAdset = calculateValuesForSpreadsheet(todayDataByAdset.rows, ['adset_id', 'campaign_name', ...SYSTEM1_SHEET_VALUES])
  await spreadsheets.updateSpreadsheet(todayDataByAdset, {spreadsheetId, sheetName: sheetNameByAdset});
}

async function updatePR_Spreadsheet() {
  const spreadsheetId = process.env.PR_SPREADSHEET_ID
  const sheetName = process.env.PR_SHEET_NAME
  const sheetNameByAdset = process.env.PR_SHEET_NAME_BY_ADSET

  const todayData = await aggregatePRConversionReport(yesterdayYMD(), todayYMD(), 'campaign_id')
  await updateSpreadsheet(todayData, {spreadsheetId, sheetName})

  const todayDataByAdset = await aggregatePRConversionReport(yesterdayYMD(), todayYMD(), 'adset_id')
  await updateSpreadsheet(todayDataByAdset, {spreadsheetId, sheetName: sheetNameByAdset})
}

async  function updateSedo_Spreadsheet() {
  const spreadsheetId = process.env.SEDO_SPREADSHEET_ID;
  const sheetName = process.env.SEDO_SHEET_BY_CAMPAIGN;
  const sheetNameByAdset = process.env.SEDO_SHEET_BY_ADSET;  
  
  const todayData = await aggregateSedoConversionReport(yesterdayYMD(null, 'UTC'), todayYMD('UTC'), 'campaign_id');
  await spreadsheets.mergeSpreadsheet(todayData, {spreadsheetId, sheetName});

  const todayDataByAdset = await aggregateSedoConversionReport(yesterdayYMD(null, 'UTC'), todayYMD('UTC'), 'adset_id');
  await spreadsheets.mergeSpreadsheet(todayDataByAdset, {spreadsheetId, sheetName: sheetNameByAdset});
}

module.exports = {
  updateCR_Spreadsheet,
  updateCR_ThreeDaySpreadsheet,
  updateOB_Spreadsheet,
  updateS1_Spreadsheet,
  updatePR_Spreadsheet,
  updateSedo_Spreadsheet
}
