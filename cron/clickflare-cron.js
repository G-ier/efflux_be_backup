const { CronJob } = require('cron');
const { yesterdayYMD, someDaysAgoYMD, todayYMD, todayYMDHM,todayTenMinsAgoYMDHM, todayFifteenMinsAgoYMDHM} = require('../common/day');
const { updateClickflareData, migrateHistoricalCFData } = require('../services/clickflareService');
const Rules = require('../constants/cron');
const { clickflareTimezone, sheetsArr } = require('../constants/clickflare');
const { updateCF_DaySpreadsheet } = require('../controllers/spreadsheetController');
const {clickflareCampaigns} = require("../common/aggregations/clickflare_report"); //workflow change
const { sendSlackNotification } = require("../services/slackNotificationService");

const disableCron = process.env.DISABLE_CRON === 'true'

const clickflareMorningFill = async () => {
  try {
    //Morning Refill of previous day data to update revenue.
    const startDate = someDaysAgoYMD(1, null, 'UTC') + ' 00:00:00';
    const endDate = someDaysAgoYMD(1, null, 'UTC') + ' 23:59:59';
    console.log("Morning Fill Start Date: ", startDate, "Morning Fill End Date: ", endDate);
    await updateClickflareData(startDate, endDate, clickflareTimezone);

    //Transfer older unused records to historical table
    let test_date = someDaysAgoYMD(7, null, 'UTC');
    console.log("unused date: ", test_date);
    await migrateHistoricalCFData(test_date);
  }  catch (err) {
    console.log(err);
    await sendSlackNotification(`Clicflare 24h Data Fetching & Backup\nError: \n${err.toString()}`);
  }
}

const updateClickflare = async () => {
  try {
    const startDate = todayFifteenMinsAgoYMDHM('UTC');
    const endDate = todayYMDHM('UTC');
    console.log("Start Date: ", startDate);
    console.log("End Date: ", endDate);
    //Retrieve data in the timelapse specified and save them on the database.
    await updateClickflareData(startDate, endDate, clickflareTimezone);
    sheetsArr.forEach(async (sheet) => {
       let min_date = someDaysAgoYMD(sheet.day - 1, null, 'UTC');
       let endDay = sheet.day == 1 ? todayYMD('UTC') : yesterdayYMD(null, 'UTC');
       console.log("Min Date: ", min_date);
       console.log("End Date: ", endDay);
       min_date = min_date + ' 00:00:00';
       endDay = endDay + ' 23:59:59';
       let traffic_source = sheet.traffic_source === 'facebook'
        ? `('62b23798ab2a2b0012d712f7', '62afb14110d7e20012e65445', '622f32e17150e90012d545ec', '62f194b357dde200129b2189')`
        : `('62b725e4ab2a2b0012d71334')`
       let camp_data = await clickflareCampaigns(min_date, endDay, 'campaign', traffic_source);
       let adset_data = await clickflareCampaigns(min_date, endDay, 'adset', traffic_source);

       await updateCF_DaySpreadsheet(sheet, camp_data, adset_data)
    })
  }
  catch (err) {
    console.log(err);
    await sendSlackNotification(`Clicflare Data Fetching & Sheet Update\nError: \n${err.toString()}`);
  }
}

const clickflareMorningCron = new CronJob(
  Rules.CF_MORNING_FILL,
  (async () => {
    console.log('Morning Fill')
    clickflareMorningFill();
  }),
);

const clickflareRegularCron = new CronJob(
  Rules.CF_REGULAR,
  (async () => {
    console.log('start clickflare data downloading')
    updateClickflare();
  }),
);


const initializeCFCron = () => {
  // (async () => {
  //   updateClickflare()
  // })();

  if (!disableCron) {
    clickflareRegularCron.start();
    clickflareMorningCron.start();
  }
};

module.exports = {
  initializeCFCron,
  updateClickflare,
  clickflareMorningFill
};
