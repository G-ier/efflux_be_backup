const route = require("express").Router();
const db = require('../../data/dbConfig');

const {
  getHourlyData,
  processHourlyData,
  updateData,
  updateSystem1Hourly
} = require('../../services/system1Service');


const {
  getCampaignNames
} = require("../../services/campaignsService");

const spreadsheets = require("../../services/spreadsheetService");

const {
  aggregateSystem1ConversionReport
} = require("../../common/aggregations");

const {
  threeDaysAgoYMD,
  yesterdayYMD,
  todayYMD,
  someDaysAgoYMD,
  dayBeforeYesterdayYMD
} = require("../../common/day");

const {
  updateS1_Spreadsheet,
} = require("../../controllers/spreadsheetController");

// const aggregateSystem1ConversionReportV2 = (startDate, endDate, groupBy) => db.raw(
//     `SELECT s1.${groupBy},
//       CAST(SUM(s1.revenue)::decimal AS FLOAT) as revenue,
//       CAST(SUM(s1.searches) AS INTEGER) as searches,
//       CAST(SUM(s1.clicks) AS INTEGER) as revenue_clicks,
//       CAST(SUM(s1.total_visitors) AS INTEGER) as visitors,
//       CASE WHEN SUM(s1.clicks) = 0 THEN NULL ELSE CAST(SUM(s1.revenue)::decimal AS FLOAT) / SUM(s1.clicks) END as rpc,
//       MAX(s1.campaign) as s1_camp_name
//     FROM system1 as s1
//     WHERE s1.date > '${startDate}' AND s1.date <= '${endDate}'
//     GROUP BY s1.${groupBy};`
// )

// function mapColumnsSystem1V2(data, columns) {
//   const totals = {};
//   data.forEach(item => {
//     columns.forEach(column => {
//       if (Number.isFinite(item[column])) {
//         totals[column] = (totals[column] || 0) + item[column];
//       }
//     });
//   });
//   totals['rpc'] = totals['revenue_clicks'] > 0 ? totals['revenue'] / totals['revenue_clicks'] : null;
//   data.unshift({ ...totals, [columns[0]]: null, [columns[1]]: 'Total' });
//   const rows = data.map(obj => columns.reduce((row, column) => ({ ...row, [column]: obj[column] || null }), {}));
//   return { columns, rows };
// }

// async function updateS1_Spreadsheet() {

//   SYSTEM1_SHEET_VALUES_V2 = [
//     'revenue',
//     'searches',
//     'lander_visits',
//     'revenue_clicks',
//     'visitors',
//     'tracked_visitors',
//     'rpm',
//     'rpc',
//     's1_camp_name'
//   ]

//   // Update Timepoints
//   const today = todayYMD('UTC');
//   const yesterday = yesterdayYMD(null, 'UTC');
//   const dayBeforeYesterday = dayBeforeYesterdayYMD(null, 'UTC');
//   const threeDaysAgo = threeDaysAgoYMD(null, 'UTC');
//   const weekAgo = someDaysAgoYMD(7, null, 'UTC');

//   const spreadsheetId = process.env.SYSTEM1_SPREADSHEET_ID

//   // Sheet Names and Timepoints
//   const SYSTEM1_SHEET_SPECIFICS_V2 = [
//     {
//     name: "Campaigns - Today",
//     startTime: yesterday,
//     endTime: today,
//     },
//     {
//     name: "Adset - Today",
//     startTime: yesterday,
//     endTime: today,
//     },
//     {
//     name: "Campaign - Yesterday",
//     startTime: dayBeforeYesterday,
//     endTime: yesterday,
//     },
//     {
//     name: "Adset - Yesterday",
//     startTime: dayBeforeYesterday,
//     endTime: yesterday,
//     },
//     {
//     name: "Campaign - Last 3days",
//     startTime: threeDaysAgo,
//     endTime: today,
//     },
//     {
//     name: "Adset - Last 3days",
//     startTime: threeDaysAgo,
//     endTime: today,
//     },
//     {
//     name: "Campaign - Last 7days",
//     startTime: weekAgo,
//     endTime: today,
//     },
//     {
//     name: "Adset - Last 7days",
//     startTime: weekAgo,
//     endTime: today,
//     }
//   ]

//   for (const sheet of SYSTEM1_SHEET_SPECIFICS_V2) {
//     const { name, startTime, endTime } = sheet
//     console.log(name, startTime, endTime)
//     let groupBy;
//     let sheetValues;
//     if (name.includes("Campaign")) {
//       groupBy = 'campaign_id'
//       sheetValues = ['campaign_id', 'campaign_name', ...SYSTEM1_SHEET_VALUES_V2]
//     }
//     else {
//       groupBy = 'adset_id'
//       sheetValues = ['adset_id', 'adset_name', ...SYSTEM1_SHEET_VALUES_V2]
//     }
//     const sheetAggregatedData = await aggregateSystem1ConversionReportV2(startTime, endTime, groupBy);
//     const postCalculatedData = mapColumnsSystem1V2(sheetAggregatedData.rows, sheetValues)
//     await spreadsheets.updateSpreadsheet(postCalculatedData, { spreadsheetId, sheetName: name});
//   }
// }


// @route     /api/debug-cron-jobs
// @desc     Runs Cron Jobs
route.get("/debug-cron-jobs", async (req, res) => {

  // Update the database
  await updateSystem1Hourly();

  // Update the spreadsheet
  await updateS1_Spreadsheet();


  res.status(200).send({ message: "debug-cron-jobs" });
});


module.exports = route;
