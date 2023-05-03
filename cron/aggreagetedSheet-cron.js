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

const disableCron = process.env.DISABLE_CRON === 'true'
const everyFifteenMinutes = '14-59/15 * * * *';

const updateAggregatedSheet = async () => {
  try {
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
