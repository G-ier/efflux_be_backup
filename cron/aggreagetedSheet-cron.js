const { CronJob } = require('cron');
const {
  TEMPLATE_SHEET_VALUES,
  TEMPLATE_ADSET_SHEET_VALUES,
  sheetsArr,
  tikTokSheetsArr
} = require('../constants/templateSheet');
const { yesterdayYMD, someDaysAgoYMD, todayYMD } = require("../common/day");
const { aggregatesGeneralized } = require("../common/aggregations/aggregatesGeneralized");
const { updateTemplateSheet } = require("../controllers/spreadsheetController");
const { sendSlackNotification } = require("../services/slackNotificationService");

const disableCron = process.env.DISABLE_CRON === 'true'
const everyFifteenMinutes = '14-59/15 * * * *';
const everyXminutes = '58 * * * *';

const updateAggregatedSheet = async () => {

  try {

      for (i=0; i < sheetsArr.length; i ++ ) {

          // Calculating start-date, end-date for each tab in the sheetsArr[i]
          let min_date = someDaysAgoYMD(sheetsArr[i].day - 1, null);
          let endDay = sheetsArr[i].day == 1 ? todayYMD('UTC') : yesterdayYMD(null);

          console.log("Start Date", min_date)
          console.log("End Date", endDay)

          // Iterating over the aggregation types [campaigns, adsets] for facebook
          for (let k = 0; k < 2; k ++) {

              aggregation = k == 0 ? 'campaigns' : 'adsets';
              columnsOrder = k == 0 ? TEMPLATE_SHEET_VALUES : TEMPLATE_ADSET_SHEET_VALUES;
              sheetName = k == 0 ? sheetsArr[i].sheetName : sheetsArr[i].sheetNameByAdset;

              console.log("Updating Facebook sheet: ", sheetName, "Aggregation: ", aggregation)

              // Fetching the aggregated data from the database
              const data = await aggregatesGeneralized(min_date, endDay, sheetDropdown=aggregation, trafficSource="facebook")

              // Updating the sheet with the fetched data
              await updateTemplateSheet(data, columnsOrder, aggregation, sheetsArr[i].spreadsheetId, sheetName)
          }
      }
  }

  catch (err) {
      await sendSlackNotification(`Fb Revealbot Sheets.\nError on update: \n${err.toString()}`)
      console.log(err)
  }
}

const updateAggregatedSheetTikTok = async () => {

  try {

      for (i=0; i < tikTokSheetsArr.length; i ++ ) {

          // Calculating start-date, end-date for each tab in the sheetsArr[i]
          let min_date = someDaysAgoYMD(sheetsArr[i].day - 1, null);
          let endDay = sheetsArr[i].day == 1 ? todayYMD('UTC') : yesterdayYMD(null);

          console.log("Start Date", min_date)
          console.log("End Date", endDay)

          // Iterating over the aggregation types [campaigns, adsets] for tiktok
          for (let k = 0; k < 2; k ++) {

            aggregation = k == 0 ? 'campaigns' : 'adsets';
            columnsOrder = k == 0 ? TEMPLATE_SHEET_VALUES : TEMPLATE_ADSET_SHEET_VALUES;
            sheetName = k == 0 ? tikTokSheetsArr[i].sheetName : tikTokSheetsArr[i].sheetNameByAdset;

            console.log("Updating Tik tok sheet: ", sheetName, "Aggregation: ", aggregation)

            // Fetching the aggregated data from the database
            const data = await aggregatesGeneralized(min_date, endDay, sheetDropdown=aggregation, trafficSource="tiktok")

            // Updating the sheet with the fetched data
            await updateTemplateSheet(data, columnsOrder, aggregation, tikTokSheetsArr[i].spreadsheetId, sheetName)
          }
      }

  } catch (err) {
    await sendSlackNotification(`Tik Tok Revealbot Sheets.\nError on update: \n${err.toString()}`)
    console.log(err)
  }
};

const aggregatedSheetFacebookRegularCron = new CronJob(
  everyFifteenMinutes,
  (async () => {
    updateAggregatedSheet();
  }),
);

const aggregatedSheetTikTokRegularCron = new CronJob(
  everyXminutes,
  (async () => {
    console.log('start aggregated sheet data downloading')
    updateAggregatedSheetTikTok();
  }),
);

const initializeAggregCron = () => {

  if (!disableCron) {
    aggregatedSheetFacebookRegularCron.start();
    aggregatedSheetTikTokRegularCron.start();
  }
};

module.exports = { initializeAggregCron };
