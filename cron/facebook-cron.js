const CronJob = require("cron").CronJob;
const { todayYMD, yesterdayYMD, todayHH, tomorrowYMD } = require("../common/day");
const Rules = require("../constants/cron");
const { updateFacebookInsights, updateFacebookData} = require("../controllers/facebookController");
const moment = require("moment-timezone");
const {updatePB_Spreadsheet, updatePB_UnknownSpreadsheet} = require('../controllers/spreadsheetController');

const disableCron = process.env.DISABLE_CRON === "true";

async function updateFacebookInsightsJob(day) {

  let date;
  if (day === "today") {
    // date = todayYMD();
    date = todayYMD('UTC');
    await updateFacebookInsights(date);
    date = tomorrowYMD(null, 'UTC');
    await updateFacebookInsights(date);
  }
  else if (day === "yesterday") {
    date = yesterdayYMD(null, 'UTC');
    await updateFacebookInsights(date);
    // date = yesterdayYMD();
  }  
  updatePB_Spreadsheet()
  updatePB_UnknownSpreadsheet()
 }

async function updateFacebookDataJob() {
  await updateFacebookData(todayYMD());
}

const newFacebookYesterdayCron = new CronJob(
  Rules.FB_DAILY,
  updateFacebookInsightsJob.bind(null, "yesterday"),
);

const facebookAfterMidnight = new CronJob(
  Rules.AFTER_MIDNIGHT,
  updateFacebookInsightsJob.bind(null, "yesterday"),
);

const facebookAfternoon = new CronJob(
  Rules.FB_AFTERNOON,
  updateFacebookInsightsJob.bind(null, "yesterday"),
);

const facebookInsisghtsJob = new CronJob(
  Rules.SEDO_REGULAR,
  updateFacebookInsightsJob.bind(null, "today"),
);

const facebookDataJob = new CronJob(
  Rules.FB_HOURLY,
  updateFacebookDataJob
)
 
const initializeFBCron = async () => {
  // await updateFacebookInsightsJob('today') // for one time
  // updatePB_Spreadsheet()
  // updatePB_UnknownSpreadsheet()
  // console.log('PST',moment().tz('America/Los_Angeles').format('YYYY-MM-DD HH:mm'))
  if (!disableCron) {
    newFacebookYesterdayCron.start();
    facebookInsisghtsJob.start();
    facebookAfterMidnight.start();
    facebookAfternoon.start();
    facebookDataJob.start();
  }

  // DEBUG: uncomment to test immediately
  // updateFacebookData('today').then(() => {console.log('debug done')});
  // updateFacebookInsights(yesterdayYMD(null, 'UTC')).then(() => {console.log('debug done')});
};

module.exports = {
  initializeFBCron,
};
