const {
  aggregateCRConversions, aggregateOBConversionReport, aggregateSystem1ConversionReport,
  aggregatePRConversionReport, aggregateSedoConversionReport,aggregatePBUnknownConversionReport, aggregatePostbackConversionReport,
  aggregateFacebookAdsTodaySpentReport
} = require("../common/aggregations");
const {yesterdayYMD, todayYMD, fourDaysAgoYMD, dayBeforeYesterdayYMD, threeDaysAgoYMD} = require("../common/day");
const spreadsheets = require("../services/spreadsheetService");
const {updateSpreadsheet} = require("../services/spreadsheetService");
const MetricsCalculator = require('../utils/metricsCalculator')

const {CROSSROADS_SHEET_VALUES} = require('../constants/crossroads')
const {SYSTEM1_SHEET_VALUES} = require('../constants/system1')
const {POSTBACK_SHEET_VALUES, POSTBACK_EXCLUDEDFIELDS} = require('../constants/postback')

function preferredOrder(obj, order) {
  let newObject = {};
  for(let i = 0; i < order.length; i++) {
    newObject[order[i]] = obj[order[i]];
  }
  return newObject;
}

function calculateValuesForSpreadsheet(data, columns) {
  const totals = columns.reduce((acc, column) => {
    data.forEach(item => {
      if(Number.isFinite(item[column])) {
        if(acc[column]) acc[column] += item[column] || 0
        else acc[column] = item[column] || 0
      }
    })
    return acc
  }, {
    campaign_name: 'TOTAL'
  })

  data = [totals, ...data]
  const rows = data.map(item => {
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

  return { columns, rows }
}

function mapValuesForSpreadsheet(data, columns, alias) {
  // get ave_rpc 
  let rpc_ave = data.reduce((group, row) => {
    if(!group[row.campaign]) {
      group[row.campaign] = {...row}
    }
    group[row.campaign].revenue += row.revenue;
    group[row.campaign].yt_revenue += row.yt_revenue;
    group[row.campaign].nt_conversion += row.nt_conversion;
    group[row.campaign].s1_nt_conversion += row.s1_nt_conversion;
    return group;
  },{})
  let yt_rpc_ave = data.reduce((group, row) => {
    if(!group[row.yt_campaign]) {
      group[row.yt_campaign] = {...row}
    }
    group[row.yt_campaign].revenue += row.revenue;
    group[row.yt_campaign].yt_revenue += row.yt_revenue;
    group[row.yt_campaign].nt_conversion += row.nt_conversion;
    group[row.yt_campaign].s1_nt_conversion += row.s1_nt_conversion;
    return group;
  },{})
  const campaigns = Object.keys(rpc_ave).map(function(x){ return rpc_ave[x]})
  const yt_campaigns = Object.keys(yt_rpc_ave).map(function(x){ return yt_rpc_ave[x]})
  let rpc_count = data.filter(el => el['rpc']);
  
  
  
  if(rpc_count.length <= 5) {
    data = data.map(item => { 
      const ave_rpc = yt_campaigns?.filter(el => el.campaign === item.campaign)
      return {
        ...item,
        rpc: item.yt_rpc,
        ave_rpc:  Math.round(ave_rpc[0]?.yt_revenue / ave_rpc[0]?.s1_yt_conversion * 100) / 100 || null 
      }
    })    
  }
  else{
    data = data.map(item => {    
      const ave_rpc = campaigns?.filter(el => el.campaign === item.campaign)       
      return {
        ...item,
        ave_rpc: Math.round(ave_rpc[0]?.revenue / ave_rpc[0]?.nt_conversion * 100) / 100 || null  
      }    
    })
  }  
  const totals = columns.reduce((acc, column) => {
    data.forEach(item => {      
      if(Number.isFinite(item[column])) {    
        if(acc[column]) acc[column] += item[column] || 0
        else acc[column] = item[column] || 0
      }
    })
    return acc
  }, {
    campaign_name: alias, 
  })  
  const yt_rpc = Math.round(totals.yt_revenue / totals.s1_yt_conversion * 100) / 100      
  totals.time_zone = 0
  totals.date = 0
  totals.rpc = Math.round(totals.revenue / totals.nt_conversion * 100) / 100  
  totals.roi = Math.round((totals.revenue - totals.amount_spent) / totals.amount_spent * 100 * 100 ) / 100  
  totals.ave_rpc = totals.ave_rpc / data.filter(el => el.ave_rpc > 0).length  
  totals.est_revenue = Math.round(((totals.pb_conversion - totals.nt_conversion) * totals.ave_rpc + totals.revenue) * 100 ) / 100  
  
  if(rpc_count.length <= 5) totals.rpc = yt_rpc; // get yesterday rpc
  data = [totals, ...data]
  const rows = data.map(item => { 
    
    const result = {
      ...item,          
      est_revenue: (item.pb_conversion - item.nt_conversion) * item.ave_rpc + item.revenue,      
      est_roi: Math.round(((item.pb_conversion - item.nt_conversion) * item.ave_rpc + item.revenue - item.amount_spent) / item.amount_spent * 100 * 100 ) / 100,
      profit: item.revenue - item.amount_spent, 
      est_profit: item.pb_conversion * item.rpc - item.amount_spent,    
     
    }
    return preferredOrder(result, columns)
  })

  return { columns, rows }
}

function mapValuesForSpreadsheetDiff(f1, f2, columns, alias) {
  
  const totals = columns.reduce((acc, column) => {
    if(Number.isFinite(f1[column])) {    
      acc[column] = f1[column] - f2[column]       
    }    
    return acc
  }, {
    campaign_name: alias, 
  })   

  return preferredOrder(totals, columns)
}

async function updateCR_Spreadsheet() {
  const spreadsheetId = process.env.SEDO_SPREADSHEET_ID;
  const sheetName = process.env.PB_CR_SHEET_NAME;
  const sheetNameByAdset = process.env.PB_CR_SHEET_BY_ADSET;

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


async function updatePB_Spreadsheet() {
  const spreadsheetId = process.env.PB_SPPEADSHEET_ID;
  const sheetName = process.env.PB_SHEET_NAME;
  const sheetNameByAdset = process.env.PB_SHEET_BY_ADSET;

  let todayData = await aggregatePostbackConversionReport(yesterdayYMD(null, 'UTC'), todayYMD('UTC'), dayBeforeYesterdayYMD(null, 'UTC') , 'campaign_id');  
  todayData = mapValuesForSpreadsheet(todayData.rows, [...POSTBACK_SHEET_VALUES('campaign_id')], 'TOTAL SHEET')
  // console.log('todayData',todayData)
  let todayTotalSpent = await aggregateFacebookAdsTodaySpentReport(todayYMD('UTC'));
  todayTotalSpent = mapValuesForSpreadsheet(todayTotalSpent.rows, [...POSTBACK_SHEET_VALUES('campaign_id')], "TOTAL FACEBOOK")  

  let todayDataDiff = mapValuesForSpreadsheetDiff(todayData.rows[0], todayTotalSpent.rows[0], [...POSTBACK_SHEET_VALUES('campaign_id')], "DIFFERENCE")  
  todayData = {...todayData, rows: [todayTotalSpent.rows[0], todayData.rows[0], todayDataDiff].concat(todayData.rows.slice(1))}

  await spreadsheets.updateSpreadsheet(todayData, {spreadsheetId, sheetName,  excludedFields: [...POSTBACK_EXCLUDEDFIELDS]});


  let todayDataByAdset = await aggregatePostbackConversionReport(yesterdayYMD(null, 'UTC'), todayYMD('UTC'), dayBeforeYesterdayYMD(null, 'UTC'), 'adset_id');
  todayDataByAdset = mapValuesForSpreadsheet(todayDataByAdset.rows, [...POSTBACK_SHEET_VALUES('adset_id')], 'TOTAL SHEET')

  todayDataDiff = mapValuesForSpreadsheetDiff(todayDataByAdset.rows[0], todayTotalSpent.rows[0], [...POSTBACK_SHEET_VALUES('campaign_id')], "DIFFERENCE")  
  todayDataByAdset = {...todayDataByAdset, rows: [todayTotalSpent.rows[0], todayDataByAdset.rows[0], todayDataDiff].concat(todayDataByAdset.rows.slice(1))}

  await spreadsheets.updateSpreadsheet(todayDataByAdset, {spreadsheetId, sheetName: sheetNameByAdset, excludedFields: [...POSTBACK_EXCLUDEDFIELDS]});
}

async function updateYesterdayPB_Spreadsheet() {
  const spreadsheetId = process.env.PB_SPPEADSHEET_ID;
  const sheetName = process.env.PB_SHEET_BY_YESTERDAY;
  const sheetNameByAdset = process.env.PB_SHEET_BY_ADSET_YESTERDAY;

  let todayData = await aggregatePostbackConversionReport(dayBeforeYesterdayYMD(null, 'UTC'), yesterdayYMD(null, 'UTC'),threeDaysAgoYMD(null, 'UTC'), 'campaign_id');
  todayData = mapValuesForSpreadsheet(todayData.rows, [...POSTBACK_SHEET_VALUES('campaign_id')])
  await spreadsheets.updateSpreadsheet(todayData, {spreadsheetId, sheetName , excludedFields: [...POSTBACK_EXCLUDEDFIELDS]});
  
  let todayDataByAdset = await aggregatePostbackConversionReport(dayBeforeYesterdayYMD(null, 'UTC'), yesterdayYMD(null, 'UTC'), threeDaysAgoYMD(null, 'UTC'), 'adset_id');
  todayDataByAdset = mapValuesForSpreadsheet(todayDataByAdset.rows, [...POSTBACK_SHEET_VALUES('adset_id')])
  await spreadsheets.updateSpreadsheet(todayDataByAdset, {spreadsheetId, sheetName: sheetNameByAdset , excludedFields: [...POSTBACK_EXCLUDEDFIELDS]});
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
  const sheetNameForYesterday = process.env.SEDO_SHEET_BY_CAMPAIGN_FOR_YESTERDAY;
  const sheetNameByAdset = process.env.SEDO_SHEET_BY_ADSET;  
  const sheetNameByAdsetForYesterday = process.env.SEDO_SHEET_BY_ADSET_FOR_YESTERDAY;  
  const sheetNameByUnknown = process.env.PB_SHEET_BY_UNKNOWN;  
  // console.log('sedo cron start')
  const todayData = await aggregateSedoConversionReport(yesterdayYMD(null, 'UTC'), todayYMD('UTC'), 'campaign_id');
  await spreadsheets.mergeSpreadsheet(todayData, {spreadsheetId, sheetName});
  const yesterdayData = await aggregateSedoConversionReport(dayBeforeYesterdayYMD(null, 'UTC'), yesterdayYMD(null, 'UTC'), 'campaign_id');
  await spreadsheets.mergeSpreadsheet(yesterdayData, {spreadsheetId, sheetNameForYesterday});

  const todayDataByAdset = await aggregateSedoConversionReport(yesterdayYMD(null, 'UTC'), todayYMD('UTC'), 'adset_id');
  await spreadsheets.mergeSpreadsheet(todayDataByAdset, {spreadsheetId, sheetName: sheetNameByAdset});
  const yesterdayDataByAdset = await aggregateSedoConversionReport(dayBeforeYesterdayYMD(null, 'UTC'), yesterdayYMD(null, 'UTC'), 'adset_id');
  await spreadsheets.mergeSpreadsheet(yesterdayDataByAdset, {spreadsheetId, sheetName: sheetNameByAdsetForYesterday});

  // export unknown postback tables
  // const pbUnknownData = await aggregatePBUnknownConversionReport(yesterdayYMD(null, 'UTC'), todayYMD('UTC'), 'campaign_id')
  // console.log('pbUnknownData',pbUnknownData);
  // await spreadsheets.updateSpreadsheet(todayData, {spreadsheetId, sheetNameByUnknown});
}

module.exports = {
  updateCR_Spreadsheet,
  updateCR_ThreeDaySpreadsheet,
  updateOB_Spreadsheet,
  updateS1_Spreadsheet,
  updatePR_Spreadsheet,
  updatePB_Spreadsheet,
  updateYesterdayPB_Spreadsheet,
  updateSedo_Spreadsheet
}
