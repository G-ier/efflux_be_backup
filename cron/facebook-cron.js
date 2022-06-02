const CronJob = require("cron").CronJob;
const { todayYMD, yesterdayYMD, todayHH } = require("../common/day");
const Rules = require("../constants/cron");
const { updateFacebookInsights, updateFacebookData, updateFacebookAdAccountsTodaySpent} = require("../controllers/facebookController");
const moment = require("moment-timezone");
const {updatePB_Spreadsheet} = require('../controllers/spreadsheetController');

const disableCron = process.env.DISABLE_CRON === "true";

async function updateFacebookInsightsJob(day) {

  let date = day;  
  await updateFacebookInsights(date);
  updatePB_Spreadsheet()
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
 
const initializeFBCron = () => {
  // updateFacebookInsightsJob('yesterday') // for one time
  // updatePB_Spreadsheet()
  // console.log('cet',moment().tz('CET').format('YYYY-MM-DD HH:mm'))
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
