const { CronJob } = require('cron');
const {
  TEMPLATE_SHEET_VALUES,
  TEMPLATE_ADSET_SHEET_VALUES,
  sheetsArr
} = require('../constants/templateSheet');
const { yesterdayYMD, someDaysAgoYMD, todayYMD } = require("../common/day");
const { templateSheetFetcher } = require("../common/aggregations/template_sheet");
const { updateTemplateSheet } = require("../controllers/spreadsheetController");
const { sendSlackNotification } = require("../services/slackNotificationService");
const { getSheetValues, updateSpreadsheet } = require("../services/spreadsheetService");

const disableCron = process.env.DISABLE_CRON === 'true'
const everyFifteenMinutes = '26-59/15 * * * *';

function mapActiveAccountValue(data) {

  return data.map(row => {
    let processedRow = row.length === 10 ? row.slice(0, 10) : row
    let dateTime = new Date(processedRow[9])
    let date = new Date()

    return {
      '' : processedRow[0],
      "Ad Account name": processedRow[1],
      "Ad Account ID": processedRow[2],
      "Time Zone": processedRow[3],
      "Currency": processedRow[4],
      "Maximum Spent": processedRow[5],
      "Account Limit spent": processedRow[6],
      "Today Spent": processedRow[7],
      "Remaining Balance": processedRow[8],
      "Referred Sheet Update Time": `${date.getDate()}/${dateTime.getHours()}:${dateTime.getMinutes() < 10 ? '0' + dateTime.getMinutes() : dateTime.getMinutes()}`,
      "Last Updated": `${date.getDate()}/${date.getHours()}:${date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()}`
    }
  })
}

const updateActiveAccountsTab = async () => {
  const spreadsheetId = "1J1S8hO4Ju_4z1-9B1MVnyESDGEST2aoMYfMTo8cUd2M";
  const sheetName = "Active Accounts";

  const writeSpreadsheetId = "1A6Pfy2GPq0z12b_CtDdaMb5zKWecJa2jkzLVA3BwBuQ"
  const writeSheetName = "Active Accounts"

  const range = sheetName;

  // get sheet values
  const { values: sheetValues } = await getSheetValues(spreadsheetId, {
    range
  });

  // Removing columns from the sheet.
  const data =  sheetValues.slice(1, sheetValues.length)

  // Converting sheet list rows to objects.
  const columns = ["", "Ad Account name", "Ad Account ID", "Time Zone", "Currency",  "Maximum Spent", "Account Limit spent", "Today Spent", "Remaining Balance", "Referred Sheet Update Time", "Last Updated"];
  const rows = mapActiveAccountValue(data)

  const processedData = {
    columns,
    rows
  }

  // Updating spreadsheet
  await updateSpreadsheet(
    processedData,
    {spreadsheetId: writeSpreadsheetId, sheetName: writeSheetName},
    predifeniedRange = "",
    include_columns = true,
    add_last_update = false
  )

}

const updateAggregatedSheet = async () => {
  try {

      // Update the active accounts sheet
      await updateActiveAccountsTab()

      for (i=0; i < sheetsArr.length; i ++ ) {

          // Calculating start-date, end-date for each tab in the sheetsArr[i]
          let min_date = someDaysAgoYMD(sheetsArr[i].day - 1, null);
          let endDay = sheetsArr[i].day == 1 ? todayYMD('UTC') : yesterdayYMD(null);
          min_date = min_date + ' 00:00:00';
          endDay = endDay + ' 23:59:59';

          // Iterating over the aggregation types [campaigns, adsets]
          for ( k = 0; k < 2; k ++) {
              aggregation = k == 0 ? 'campaigns' : 'adsets';
              columnsOrder = k == 0 ? TEMPLATE_SHEET_VALUES : TEMPLATE_ADSET_SHEET_VALUES;
              sheetName = k == 0 ? sheetsArr[i].sheetName : sheetsArr[i].sheetNameByAdset;

              console.log("Updating sheet: ", sheetName, "Aggregation: ", aggregation)

              // Fetching the aggregated data from the database
              const data = await templateSheetFetcher(min_date, endDay, telemetry=false, sheetDropdown=aggregation)

              // Updating the sheet with the fetched data
              await updateTemplateSheet(data, columnsOrder, aggregation, sheetsArr[i].spreadsheetId, sheetName)
          }
      }
  }
  catch (err) {
      await sendSlackNotification(`Fb Revealbot Sheets.\nError on update: \n${err.toString()}`)
  }
}

const aggregatedSheetRegularCron = new CronJob(
  everyFifteenMinutes,
  (async () => {
    console.log('start aggregated sheet data downloading')
    updateAggregatedSheet();
  }),
);

const initializeAggregCron = () => {

  if (!disableCron) {
    aggregatedSheetRegularCron.start();
  }
};

module.exports = { initializeAggregCron };
