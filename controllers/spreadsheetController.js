const _ = require('lodash');
const {
  crossroadsCampaigns, crossroadsAdsets,crossroadsCampaignsByHour, crossroadsAdsetsByHour, aggregateOBConversionReport, aggregateSystem1ConversionReport,
  aggregatePRConversionReport, aggregateSedoConversionReport,aggregatePBUnknownConversionReport, aggregatePostbackConversionReport,
  aggregateFacebookAdsTodaySpentReport,aggregateCampaignConversionReport, aggregatePostbackConversionByTrafficReport, aggregateSedoConversion1Report,
  aggregateCRConversions, //clickflareCampaigns,
} = require("../common/aggregations");
const {yesterdayYMD, todayYMD, dayBeforeYesterdayYMD, threeDaysAgoYMD, someDaysAgoYMD, todayHH} = require("../common/day");
const spreadsheets = require("../services/spreadsheetService");
const {updateSpreadsheet} = require("../services/spreadsheetService");
const MetricsCalculator = require('../utils/metricsCalculator')
const MetricsCalculator1 = require('../utils/metricsCalculator1')

const {CROSSROADS_SHEET_VALUES, CROSSROADSDATA_SHEET_VALUES, CROSSROADS_TODAY_HOURLY_DATA_SHEET_VALUES, hourlySheetDaysArr} = require('../constants/crossroads')
const {SYSTEM1_SHEET_VALUES} = require('../constants/system1')
const {POSTBACK_SHEET_VALUES, POSTBACK_EXCLUDEDFIELDS, pbNetMapFields, sheetsArr, unknownSheetArr, PB_SHEETS, PB_SHEET_VALUES} = require('../constants/postback');
const { SEDO_SHEET, SEDO_SHEET_VALUES } = require("../constants/sedo");
const { crossroadsAdsetsForToday, crossroadsCampaignsForToday, crossroadsNames } = require("../common/aggregations/crossroads_campaigns");
const e = require('express');
const { CLICKFLAREDATA_SHEET_VALUES } = require('../constants/clickflare');
const { campaign } = require('google-ads-api/build/src/protos/autogen/resourceNames');

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
  console.log(data);
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
      roi_today: calcResult.roi_today,
      roi_yesterday: calcResult.roi_yesterday,
      roi_2_days_ago: calcResult.roi_2_days_ago,
      roi_3_days_ago: calcResult.roi_3_days_ago,
      roi_last_3_days_total: calcResult.roi_last_3_days_total,
      roi_last_7_days_total: calcResult.roi_last_7_days_total,
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
  let campData = await crossroadsCampaigns(someDaysAgoYMD(day), yesterdayYMD(), traffic_source);
  campData = calculateValuesForSpreadsheet(campData.rows, ['campaign_id','campaign_name', ...CROSSROADSDATA_SHEET_VALUES]);
  await spreadsheets.updateSpreadsheet(campData, {spreadsheetId, sheetName});

  let adsetData = await crossroadsAdsets(someDaysAgoYMD(day), yesterdayYMD(), traffic_source);
  adsetData = calculateValuesForSpreadsheet(adsetData.rows, ['adset_id','adset_name', ...CROSSROADSDATA_SHEET_VALUES]);
  await spreadsheets.updateSpreadsheet(adsetData, {
    spreadsheetId,
    sheetName: sheetNameByAdset
  });
}

function calculateValuesForCFSpreadsheet(data, columns){
  const rows = data.map(item => {
    const result = {
      campaign_id: item.campaign_id,
      adset_id: item.adset_id,
      campaign_name: item.campaign_name,
      adset_name: item.adset_name,
      revenue: item.revenue,
      visits: item.visits,
      clicks: item.clicks,
      conversions: item.conversions,
      timezone: item.timezone || 'Missing Record',
    }
    return preferredOrder(result, columns)
  })

  return {columns, rows}
}

async function updateCF_DaySpreadsheet(sheetData, campaign_data, adset_data) {
  //input sheetdata, campaign_data, adset_data
  const {spreadsheetId, sheetName, sheetNameByAdset, day, traffic_source} = sheetData;
  const endDay = day == 1 ? todayYMD() : yesterdayYMD();
  console.log("Sheet Name", sheetName, "Start Date in Update CF Sheet", someDaysAgoYMD(day - 1), "End Date", endDay)

  let campData = campaign_data // await clickflareCampaigns(someDaysAgoYMD(day), endDay, traffic_source, 'campaign_id', 'campaign_name');
  // console.log("Campaign Data", campData)
  campData = calculateValuesForCFSpreadsheet(campData.rows, ['campaign_id','campaign_name', ...CLICKFLAREDATA_SHEET_VALUES]);
  await spreadsheets.updateSpreadsheet(campData, {spreadsheetId, sheetName});

  let adsetData = adset_data// await clickflareCampaigns(someDaysAgoYMD(day), endDay, traffic_source, 'adset_id', 'adset_name');
  adsetData = calculateValuesForCFSpreadsheet(adsetData.rows, ['adset_id','adset_name', ...CLICKFLAREDATA_SHEET_VALUES]);

  await spreadsheets.updateSpreadsheet(adsetData, {
    spreadsheetId,
    sheetName: sheetNameByAdset
  });
}

function calculateValuesForAggSpreadsheet(data, columns, aggregation = 'campaigns') {

  const rows = data.map(item => {
    const result = {
      // facebook
      ad_account_name: item.ad_account_name,
      time_zone: item.time_zone,
      entity_name: item.entity_name,
      status: item.status,
      launch_date: item.launch_date,
      amount_spent: item.amount_spent,
      impressions: item.impressions,
      link_clicks: item.link_clicks,
      cpc_link_click: item.cpc_link_click,
      clicks_all: item.clicks,
      cpc_all: item.cpc_all,
      cpm: item.cpm,
      ctr_fb: item.ctr_fb,
      results: item.results,
      cost_per_result: null,
      fb_last_update: item.fb_updated_at,

      // crossroads
      visitors: item.visitors,
      lander_visits: item.lander_visits,
      lander_searches: item.lander_searches,
      revenue_events: item.revenue_events,
      ctr_cr: item.ctr_cr,
      rpc: item.rpc,
      rpm: item.rpm,
      rpv: item.rpv,
      publisher_revenue: item.publisher_revenue,
      cr_last_update: item.cr_updated_at,

      // clickflare
      tr_visits: item.tr_visits,
      tr_searches: item.tr_searches,
      tr_conversions: item.tr_conversions,
      tr_ctr: item.tr_ctr,
      cf_last_update: item.created_at,

      // postback_events
      pb_lander_conversions: item.pb_lander_conversions,
      pb_serp_conversions: item.pb_serp_conversions,
      pb_conversions: item.pb_conversions
    }

    // Change the delete on adset vs campaign
    aggregation === 'campaigns'
    ? result.campaign_id = item.campaign_id
    : result.adset_id = item.adset_id

    return preferredOrder(result, columns)
  })
  return {columns, rows}
}

async function updateTemplateSheet(data, columnsOrder, aggregation, updateSpreadsheetId, updateSheetName) {

    // Formating the spreadsheet data and sorting it.
    let aggregatedData = calculateValuesForAggSpreadsheet(data, columnsOrder, aggregation=aggregation)

    // Sort the list of dictionaries by putting those which we find in the database first
    aggregatedData.rows.sort(function(a, b) {
      // compare the "missing" attributes
      if (a.entity_name === 'N/A' && b.entity_name !== 'N/A') {
          return 1; // move 'a' to the end of the list
      } else if (a.entity_name !== 'N/A' && b.entity_name === 'N/A') {
          return -1; // move 'b' to the end of the list
      } else {
          return 0; // leave the order unchanged
      }
    });

    // Updating the spreadsheet with the sorted list.
    await updateSpreadsheet(
      aggregatedData,
      {spreadsheetId: updateSpreadsheetId, sheetName: updateSheetName}, // Change sheetName to sheetNameByAdset
      predifeniedRange=`!A3:AL1000`,
      include_columns = false,
      add_last_update = true
    );

}

async function updateCR_TodaySpreadsheet(sheetData) {
  const {spreadsheetId, sheetName, sheetNameByAdset, traffic_source, hour} = sheetData;

  let campData = await crossroadsCampaignsForToday(yesterdayYMD(), todayYMD(), traffic_source, todayHH(hour));
  campData = calculateValuesForSpreadsheet(campData.rows, ['campaign_id','campaign_name', ...CROSSROADSDATA_SHEET_VALUES]);
  await spreadsheets.updateSpreadsheet(campData, {spreadsheetId, sheetName});

  let adsetData = await crossroadsAdsetsForToday(yesterdayYMD(), todayYMD(), traffic_source, todayHH(hour));
  adsetData = calculateValuesForSpreadsheet(adsetData.rows, ['adset_id','adset_name', ...CROSSROADSDATA_SHEET_VALUES]);
  await spreadsheets.updateSpreadsheet(adsetData, {
    spreadsheetId,
    sheetName: sheetNameByAdset
  });
}

async function updateCR_HourlySpreadsheet(sheetData) {
  const {spreadsheetId, sheetName, sheetNameByAdset, traffic_source} = sheetData;

  let allCampData = {};
  await Promise.all(hourlySheetDaysArr.map(async (item) => {
    let campData = await crossroadsCampaignsByHour(someDaysAgoYMD(item.startDay), someDaysAgoYMD(item.endDay), traffic_source, 'campaign_id', 'campaign_name', item.suffix);
    if(!allCampData.rows) {
      allCampData.rows = campData.rows;
    }
    const merged = _.merge(_.keyBy(allCampData.rows, ({campaign_id, hour}) => {return `${campaign_id}||${hour}`}), _.keyBy(campData.rows, ({campaign_id, hour}) => {return `${campaign_id}||${hour}`}));
    allCampData.rows = _.values(merged);
  }))

  const { rows:campaignNames } = await crossroadsNames();
  allCampData.rows = allCampData.rows.map(el => {
    const mapName = _.find(campaignNames, (item) => item.campaign_id == el.campaign_id) || el
    return {...el, campaign_name: mapName.campaign_name}
  })

  allCampData = calculateValuesForSpreadsheet(allCampData.rows, ['campaign_id','campaign_name', 'hour', ...CROSSROADS_TODAY_HOURLY_DATA_SHEET_VALUES]);
  allCampData.rows = _.orderBy(allCampData.rows, ['campaign_id','campaign_name','hour'],['desc'])
  await spreadsheets.updateSpreadsheet(allCampData, {spreadsheetId, sheetName});

  let allAdsetData = {};
  await Promise.all(hourlySheetDaysArr.map(async (item) => {
    let adsetData = await crossroadsCampaignsByHour(someDaysAgoYMD(item.startDay), someDaysAgoYMD(item.endDay), traffic_source, 'adset_id', 'adset_name', item.suffix);

    if(!allAdsetData.rows) {
      allAdsetData.rows = adsetData.rows;
    }
    const merged = _.merge(_.keyBy(allAdsetData.rows, ({adset_id, hour}) => {return `${adset_id}||${hour}`}), _.keyBy(adsetData.rows, ({adset_id, hour}) => {return `${adset_id}||${hour}`}));
    allAdsetData.rows = _.values(merged);
  }))

  const { rows:adsetNames } = await crossroadsNames();
  allAdsetData.rows = allAdsetData.rows.map(el => {
    const mapName = _.find(adsetNames, (item) => item.adset_id == el.adset_id) || el
    return {...el, adset_name: mapName.adset_name}
  })

  allAdsetData = calculateValuesForSpreadsheet(allAdsetData.rows,['adset_id','adset_name', 'hour', ...CROSSROADS_TODAY_HOURLY_DATA_SHEET_VALUES]);
  allAdsetData.rows = _.orderBy(allAdsetData.rows, ['adset_id','adset_name','hour'],['desc'])
  await spreadsheets.updateSpreadsheet(allAdsetData, {spreadsheetId, sheetName: sheetNameByAdset});
}

async function updateOB_Spreadsheet() {
  const spreadsheetId = process.env.OB_SPREADSHEET_ID;
  const sheetName = process.env.OB_SHEET_NAME;

  const data = await aggregateOBConversionReport(yesterdayYMD(), todayYMD());
  await spreadsheets.updateSpreadsheet(data, {spreadsheetId, sheetName});
}

function mapColumnsSystem1Spreadsheet(data, columns) {
  const totals = {};
  data.forEach(item => {
    columns.forEach(column => {
      if (Number.isFinite(item[column])) {
        totals[column] = (totals[column] || 0) + item[column];
      }
    });
  });
  totals['rpc'] = totals['revenue_clicks'] > 0 ? (totals['revenue'] / totals['revenue_clicks']).toFixed(2) : null;
  data.unshift({ ...totals, [columns[0]]: null, [columns[1]]: 'Total' });
  const rows = data.map(obj => columns.reduce((row, column) => ({ ...row, [column]: obj[column] || null }), {}));
  return { columns, rows };
}

async function updateS1_Spreadsheet() {
  const spreadsheetId = "1_3GJaATTKXvhxGVfyL5okufs8fXyLrVYh3kGWgAkz68"

  // Update Timepoints
  const today = todayYMD();
  const yesterday = yesterdayYMD(null);
  const dayBeforeYesterday = dayBeforeYesterdayYMD(null);
  const threeDaysAgo = threeDaysAgoYMD(null);
  const weekAgo = someDaysAgoYMD(7, null);

  // Sheet Names and Timepoints
  const SYSTEM1_SHEET_SPECIFICS = [
    {
    name: "Campaigns - Today",
    startTime: yesterday,
    endTime: today,
    },
    {
    name: "Adset - Today",
    startTime: yesterday,
    endTime: today,
    },
    {
    name: "Campaign - Yesterday",
    startTime: dayBeforeYesterday,
    endTime: yesterday,
    },
    {
    name: "Adset - Yesterday",
    startTime: dayBeforeYesterday,
    endTime: yesterday,
    },
    {
    name: "Campaign - Last 3days",
    startTime: threeDaysAgo,
    endTime: yesterday,
    },
    {
    name: "Adset - Last 3days",
    startTime: threeDaysAgo,
    endTime: yesterday,
    },
    {
    name: "Campaign - Last 7days",
    startTime: weekAgo,
    endTime: yesterday,
    },
    {
    name: "Adset - Last 7days",
    startTime: weekAgo,
    endTime: yesterday,
    }
  ]

  for (const sheet of SYSTEM1_SHEET_SPECIFICS) {
    const { name, startTime, endTime } = sheet
    console.log(name, startTime, endTime)
    let groupBy;
    let sheetValues;
    if (name.includes("Campaign")) {
      groupBy = 'campaign_id'
      sheetValues = ['campaign_id', 'campaign_name', ...SYSTEM1_SHEET_VALUES]
    }
    else {
      groupBy = 'adset_id'
      sheetValues = ['adset_id', 'adset_name', ...SYSTEM1_SHEET_VALUES]
    }
    const sheetAggregatedData = await aggregateSystem1ConversionReport(startTime, endTime, groupBy);
    const postCalculatedData = mapColumnsSystem1Spreadsheet(sheetAggregatedData.rows, sheetValues)
    await spreadsheets.updateSpreadsheet(postCalculatedData, { spreadsheetId, sheetName: name});
  }

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
    let todayData = await aggregatePostbackConversionReport(dayBeforeYesterdayYMD(null, 'UTC'), yesterdayYMD(null, 'UTC'), threeDaysAgoYMD(null, 'UTC'), 'campaign_id', accounts, network, timezone);
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

async function updateSedo_Conversion_Spreadsheet() {
  for(let i=0;i<SEDO_SHEET.length;i++){
    const {spreadsheetId, sheetName, sheetNameByAdset, timezone, fromDay, toDay} = SEDO_SHEET[i];
    // campaign sheet
    let todayData = await aggregateSedoConversion1Report(someDaysAgoYMD(fromDay, null, timezone), someDaysAgoYMD(toDay, null, timezone) , 'campaign_id');
    todayData = calculateValuesForSpreadsheet(todayData.rows, ['campaign_id', ...SEDO_SHEET_VALUES]);
    await spreadsheets.updateSpreadsheet(todayData, {spreadsheetId, sheetName});

    // adset sheet
    let todayDataByAdset = await aggregateSedoConversion1Report(someDaysAgoYMD(fromDay, null, timezone), someDaysAgoYMD(toDay, null, timezone), 'adset_id');
    todayDataByAdset = calculateValuesForSpreadsheet(todayDataByAdset.rows, ['adset_id', ...SEDO_SHEET_VALUES]);
    await spreadsheets.updateSpreadsheet(todayDataByAdset, {spreadsheetId, sheetName: sheetNameByAdset});

  }
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
  updateSedo_Conversion_Spreadsheet,
  updatePB_UnknownSpreadsheet,
  updateCR_TodaySpreadsheet,
  updateCR_HourlySpreadsheet,
  updateTemplateSheet,
  updateCF_DaySpreadsheet,
  preferredOrder,
  calculateValuesForCFSpreadsheet
}
