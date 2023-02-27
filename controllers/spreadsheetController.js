const {
  crossroadsCampaigns, crossroadsAdsets, aggregateOBConversionReport, aggregateSystem1ConversionReport,
  aggregatePRConversionReport, aggregateSedoConversionReport,aggregatePBUnknownConversionReport, aggregatePostbackConversionReport,
  aggregateFacebookAdsTodaySpentReport,aggregateCampaignConversionReport, aggregatePostbackConversionByTrafficReport,
} = require("../common/aggregations");
const {yesterdayYMD, todayYMD, fourDaysAgoYMD, dayBeforeYesterdayYMD, threeDaysAgoYMD, someDaysAgoYMD} = require("../common/day");
const spreadsheets = require("../services/spreadsheetService");
const {updateSpreadsheet} = require("../services/spreadsheetService");
const MetricsCalculator = require('../utils/metricsCalculator')
const MetricsCalculator1 = require('../utils/metricsCalculator1')

const {CROSSROADS_SHEET_VALUES, CROSSROADSDATA_SHEET_VALUES} = require('../constants/crossroads')
const {SYSTEM1_SHEET_VALUES} = require('../constants/system1')
const {POSTBACK_SHEET_VALUES, POSTBACK_EXCLUDEDFIELDS, pbNetMapFields, sheetsArr, unknownSheetArr, PB_SHEETS, PB_SHEET_VALUES} = require('../constants/postback')

function preferredOrder(obj, order) {
  let newObject = {};
  for(let i = 0; i < order.length; i++) {
    newObject[order[i]] = obj[order[i]];
  }
  return newObject;
}

function calculateTotalsForSpreadsheet(data, columns){
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
  return { columns, rows: data }
}
function calculateValuesForSpreadsheet(data, columns) {
  data = data.filter(item => !isNaN(item[columns[0]]) && Number(item[columns[0]]) != 0);
  const totals = columns.reduce((acc, column) => {
    data.forEach(item => {
      if(Number.isFinite(item[column])) {
        if(acc[column]) acc[column] += item[column] || 0
        else acc[column] = item[column] || 0
      }
    })
    return acc
  }, {
    campaign_name: 'TOTAL',
    adset_name: 'TOTAL'
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
      cr_rpc: calcResult.cr_rpc,
      cr_rpm: calcResult.cr_rpm,
      live_cpa: calcResult.live_cpa,
      cpc: calcResult.cpc,
      unique_cpa: calcResult.unique_cpa,
      unique_rpc: calcResult.unique_rpc,
    }
    return preferredOrder(result, columns)
  })

  return { columns, rows }
}

function mapAveRpc(data) {

  let ave_rpcs = data.reduce((group, row) => {
    const network = pbNetMapFields[row.network];
    if(network?.campaign){
      if(!group[row[network.campaign]]) {
        group[row[network.campaign]] = {
          campaign: row[network.campaign],
          revenue: row[network?.revenue],
          conversion: row[network?.conversion],
        }
      }
      group[row[network.campaign]].revenue += row[network?.revenue];
      group[row[network.campaign]].conversion += row[network?.conversion];
    }
    return group;
  },{})
  let ave_rpcs_y = data.reduce((group, row) => {
    const network = pbNetMapFields[row.network];
    if(network?.campaign){
      if(!group[row[network.campaign_y]]) {
        group[row[network.campaign_y]] = {
          campaign_y: row[network.campaign_y],
          revenue_y: row[network?.revenue_y],
          conversion_y: row[network?.conversion_y],
        }
      }
      group[row[network.campaign_y]].revenue_y += row[network?.revenue_y];
      group[row[network.campaign_y]].conversion_y += row[network?.conversion_y];
    }
    return group;
  },{})
  const campaigns = Object.keys(ave_rpcs).map(function(x){ return ave_rpcs[x]})
  const campaigns_y = Object.keys(ave_rpcs_y).map(function(x){ return ave_rpcs_y[x]})
  data = data.map(item => {
    const network = pbNetMapFields[item.network];
    const isAveRpc = campaigns?.filter(el => el.campaign === item[network?.campaign])
    const isAveRpcY = campaigns_y?.filter(el => el.campaign_y === item[network?.campaign_y])
    return {
      ...item,
      ave_revenue: isAveRpc[0]?.revenue || 0,
      ave_conversion: isAveRpc[0]?.conversion || 0,
      ave_revenue_y: isAveRpcY[0]?.revenue_y || 0,
      ave_conversion_y: isAveRpcY[0]?.conversion_y || 0
    }
  })
  return data
}

function calculateValuesForSpreadsheet1(data, columns, alias) {
  data = data.filter(item => item.campaign_name !== null)
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
    date: '',
  })
  totals.time_zone = undefined
  data = [totals, ...data]
  const rows = data.map(item => {
    const calcResult = new MetricsCalculator1(item)
    const result = {
      ...calcResult,
      est_revenue: calcResult.round(calcResult.est_revenue),
      roi: calcResult.round(calcResult.roi),
      est_roi: calcResult.round(calcResult.est_roi),
      profit: calcResult.round(calcResult.profit),
      est_profit: calcResult.round(calcResult.est_profit),
      rpc: calcResult.round(calcResult.rpc),
      live_cpa: calcResult.round(calcResult.live_cpa),
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
      const ave_rpc = yt_campaigns?.filter(el => el.yt_campaign === item.yt_campaign)
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
      time_zone: item.time_zone >= 0 ? 'UTC +' + item.time_zone:'UTC -' + item.time_zone,
      est_revenue: (item.pb_conversion - item.nt_conversion) * item.ave_rpc + item.revenue,
      est_roi: Math.round(((item.pb_conversion - item.nt_conversion) * item.ave_rpc + item.revenue - item.amount_spent) / item.amount_spent * 100 * 100 ) / 100,
      profit: item.revenue - item.amount_spent,
      est_profit: item.pb_conversion * item.rpc - item.amount_spent,
      live_cpa: Math.round(item.amount_spent / item.pb_conversion * 100 ) / 100
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

function mergeAvgRPC(left, right){
  const mergedData = left.map(item => {
    const ave_rpc = right.filter(el => el.campaign == (item.s1_campaign || item.sd_campaign || item.sd_campaign_y || item.s1_campaign_y))[0]?.ave_rpc || 0
    return {
      ...item,
      ave_rpc
    }
  })
  // console.log('mergedData', mergedData)
  return mergedData;
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

  let threeDayFacebookPostbackConversions = await aggregateCRConversions(someDaysAgoYMD(4), yesterdayYMD(), 'campaign_id');
  threeDayFacebookPostbackConversions = calculateValuesForSpreadsheet(threeDayFacebookPostbackConversions.rows, ['campaign_id', 'campaign_name', ...CROSSROADS_SHEET_VALUES]);
  await spreadsheets.updateSpreadsheet(threeDayFacebookPostbackConversions, {spreadsheetId, sheetName});

  let threeDayFacebookPostbackConversionsByAdset = await aggregateCRConversions(someDaysAgoYMD(4), yesterdayYMD(), 'adset_id');
  threeDayFacebookPostbackConversionsByAdset = calculateValuesForSpreadsheet(threeDayFacebookPostbackConversionsByAdset.rows, ['adset_id', 'campaign_name', ...CROSSROADS_SHEET_VALUES]);
  await spreadsheets.updateSpreadsheet(threeDayFacebookPostbackConversionsByAdset, {
    spreadsheetId,
    sheetName: sheetNameByAdset
  });
}

async function updateCR_DaySpreadsheet(sheetData) {
  const {spreadsheetId, sheetName, sheetNameByAdset, day, traffic_source} = sheetData;
  let dayFacebookPostbackConversions = await crossroadsCampaigns(someDaysAgoYMD(day), yesterdayYMD(), traffic_source);
  dayFacebookPostbackConversions = calculateValuesForSpreadsheet(dayFacebookPostbackConversions.rows, ['campaign_id','campaign_name', ...CROSSROADSDATA_SHEET_VALUES]);
  await spreadsheets.updateSpreadsheet(dayFacebookPostbackConversions, {spreadsheetId, sheetName});

  let dayFacebookPostbackConversionsByAdset = await crossroadsAdsets(someDaysAgoYMD(day), yesterdayYMD(), traffic_source);
  dayFacebookPostbackConversionsByAdset = calculateValuesForSpreadsheet(dayFacebookPostbackConversionsByAdset.rows, ['adset_id','adset_name', ...CROSSROADSDATA_SHEET_VALUES]);
  await spreadsheets.updateSpreadsheet(dayFacebookPostbackConversionsByAdset, {
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
  for(let i=0;i<sheetsArr.length;i++){
    const {spreadsheetId, sheetName, sheetNameByAdset, accounts, network, timezone} = sheetsArr[i];
    // campaign sheet
    let todayData = await aggregatePostbackConversionReport(yesterdayYMD(null, timezone), todayYMD(timezone), dayBeforeYesterdayYMD(null, timezone) , 'campaign_id', accounts, network, timezone);
    const aveByCampaignData = await aggregateCampaignConversionReport(network, 'today');
    todayData.rows = mergeAvgRPC(todayData.rows, aveByCampaignData.rows);
    todayData = calculateValuesForSpreadsheet1(todayData.rows, [...POSTBACK_SHEET_VALUES('campaign_id')], 'TOTAL SHEET')

    let todayTotalSpent = await aggregateFacebookAdsTodaySpentReport(todayYMD(timezone), accounts, network, timezone);
    todayTotalSpent = calculateValuesForSpreadsheet1(todayTotalSpent.rows, [...POSTBACK_SHEET_VALUES('campaign_id')], "TOTAL API")
    let todayDataDiff = mapValuesForSpreadsheetDiff(todayData.rows[0], todayTotalSpent.rows[0], [...POSTBACK_SHEET_VALUES('campaign_id')], "DIFFERENCE")
    todayData = {...todayData, rows: [todayTotalSpent.rows[0], todayData.rows[0], todayDataDiff].concat(todayData.rows.slice(1))}

    await spreadsheets.updateSpreadsheet(todayData, {spreadsheetId, sheetName,  excludedFields: [...POSTBACK_EXCLUDEDFIELDS]});

    // adset sheet
    let todayDataByAdset = await aggregatePostbackConversionReport(yesterdayYMD(null, timezone), todayYMD(timezone), dayBeforeYesterdayYMD(null, timezone), 'adset_id', accounts, network, timezone);
    todayDataByAdset.rows = mergeAvgRPC(todayDataByAdset.rows, aveByCampaignData.rows);
    todayDataByAdset = calculateValuesForSpreadsheet1(todayDataByAdset.rows, [...POSTBACK_SHEET_VALUES('adset_id')], 'TOTAL SHEET')

    todayDataDiff = mapValuesForSpreadsheetDiff(todayDataByAdset.rows[0], todayTotalSpent.rows[0], [...POSTBACK_SHEET_VALUES('campaign_id')], "DIFFERENCE")
    todayDataByAdset = {...todayDataByAdset, rows: [todayTotalSpent.rows[0], todayDataByAdset.rows[0], todayDataDiff].concat(todayDataByAdset.rows.slice(1))}

    await spreadsheets.updateSpreadsheet(todayDataByAdset, {spreadsheetId, sheetName: sheetNameByAdset, excludedFields: [...POSTBACK_EXCLUDEDFIELDS]});
  }

}

async function updatePB_SpreadsheetByTraffic() {
  for(let i=0;i<PB_SHEETS.length;i++){
    const {spreadsheetId, sheetName, sheetNameByAdset, network, traffic, timezone, fromDay, toDay} = PB_SHEETS[i];
    // campaign sheet
    let todayData = await aggregatePostbackConversionByTrafficReport(someDaysAgoYMD(fromDay, null, timezone), someDaysAgoYMD(toDay, null, timezone) , 'campaign_id', network, traffic);
    todayData = calculateValuesForSpreadsheet(todayData.rows, ['campaign_id','campaign_name', ...PB_SHEET_VALUES]);
    await spreadsheets.updateSpreadsheet(todayData, {spreadsheetId, sheetName});

    // adset sheet
    let todayDataByAdset = await aggregatePostbackConversionByTrafficReport(someDaysAgoYMD(fromDay, null, timezone), someDaysAgoYMD(toDay, null, timezone), 'adset_id', network, traffic);
    todayDataByAdset = calculateValuesForSpreadsheet(todayDataByAdset.rows, ['adset_id','campaign_name', ...PB_SHEET_VALUES]);
    await spreadsheets.updateSpreadsheet(todayDataByAdset, {spreadsheetId, sheetName: sheetNameByAdset});

  }

}

async function updateYesterdayPB_Spreadsheet() {

  for(let i=0;i<sheetsArr.length;i++){
    const {spreadsheetId, sheetName_Y: sheetName, sheetNameByAdset_Y: sheetNameByAdset, accounts, network, timezone} = sheetsArr[i];
    let todayData = await aggregatePostbackConversionReport(dayBeforeYesterdayYMD(null, 'UTC'), yesterdayYMD(null, 'UTC'),threeDaysAgoYMD(null, 'UTC'), 'campaign_id', accounts, network, timezone);
    const aveByCampaignData = await aggregateCampaignConversionReport(network, 'yesterday');
    todayData.rows = mergeAvgRPC(todayData.rows, aveByCampaignData.rows);
    todayData = calculateValuesForSpreadsheet1(todayData.rows, [...POSTBACK_SHEET_VALUES('campaign_id')], 'TOTAL')

    let todayTotalSpent = await aggregateFacebookAdsTodaySpentReport(yesterdayYMD(null, timezone), accounts, network, timezone);
    todayTotalSpent = calculateValuesForSpreadsheet1(todayTotalSpent.rows, [...POSTBACK_SHEET_VALUES('campaign_id')], "TOTAL API")

    let todayDataDiff = mapValuesForSpreadsheetDiff(todayData.rows[0], todayTotalSpent.rows[0], [...POSTBACK_SHEET_VALUES('campaign_id')], "DIFFERENCE")
    todayData = {...todayData, rows: [todayTotalSpent.rows[0], todayData.rows[0], todayDataDiff].concat(todayData.rows.slice(1))}

    await spreadsheets.updateSpreadsheet(todayData, {spreadsheetId, sheetName , excludedFields: [...POSTBACK_EXCLUDEDFIELDS]});

    let todayDataByAdset = await aggregatePostbackConversionReport(dayBeforeYesterdayYMD(null, 'UTC'), yesterdayYMD(null, 'UTC'), threeDaysAgoYMD(null, 'UTC'), 'adset_id', accounts, network, timezone);

    todayDataByAdset.rows = mergeAvgRPC(todayDataByAdset.rows, aveByCampaignData.rows);
    todayDataByAdset = calculateValuesForSpreadsheet1(todayDataByAdset.rows, [...POSTBACK_SHEET_VALUES('adset_id')], 'TOTAL')

    todayDataDiff = mapValuesForSpreadsheetDiff(todayDataByAdset.rows[0], todayTotalSpent.rows[0], [...POSTBACK_SHEET_VALUES('campaign_id')], "DIFFERENCE")
    todayDataByAdset = {...todayDataByAdset, rows: [todayTotalSpent.rows[0], todayDataByAdset.rows[0], todayDataDiff].concat(todayDataByAdset.rows.slice(1))}

    await spreadsheets.updateSpreadsheet(todayDataByAdset, {spreadsheetId, sheetName: sheetNameByAdset , excludedFields: [...POSTBACK_EXCLUDEDFIELDS]});
  }
}

async function updatePB_UnknownSpreadsheet() {
  for(let i = 0; i < unknownSheetArr.length; i++){
    let todayData = await aggregatePBUnknownConversionReport(unknownSheetArr[i]);
    const columns = todayData.fields.map((field) => field.name);
    todayData = calculateTotalsForSpreadsheet(todayData.rows, columns)
    await spreadsheets.updateSpreadsheet(
      {rows:todayData.rows, columns},
      {
        spreadsheetId: unknownSheetArr[i].spreadsheetId,
        sheetName: unknownSheetArr[i].sheetName,
        excludedFields:unknownSheetArr[i].excludedFields
      });
  }
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

}

module.exports = {
  updateCR_Spreadsheet,
  updateCR_ThreeDaySpreadsheet,
  updateCR_DaySpreadsheet,
  updateOB_Spreadsheet,
  updateS1_Spreadsheet,
  updatePR_Spreadsheet,
  updatePB_Spreadsheet,
  updatePB_SpreadsheetByTraffic,
  updateYesterdayPB_Spreadsheet,
  updateSedo_Spreadsheet,
  updatePB_UnknownSpreadsheet
}
