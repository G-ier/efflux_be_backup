const CronJob = require("cron").CronJob;
const { todayYMD, yesterdayYMD, todayHH, dayBeforeYesterdayYMD, tomorrowYMD } = require("../common/day");
const Rules = require("../constants/cron");
const { updateFacebookInsights, updateFacebookData} = require("../controllers/facebookController");
const moment = require("moment-timezone");
const {updatePB_Spreadsheet, updatePB_UnknownSpreadsheet} = require('../controllers/spreadsheetController');
const { updateTablePartitions } = require("./helpers");

const disableCron = process.env.DISABLE_CRON === "true";

async function updateFacebookInsightsJob(day) {

  let date;
  if (day === "today") {
    // date = todayYMD();
    date = yesterdayYMD(null, 'UTC');
    await updateFacebookInsights(date);
    date = todayYMD('UTC');
    await updateFacebookInsights(date);
    date = tomorrowYMD(null, 'UTC');
    await updateFacebookInsights(date);
  }
  else if (day === "yesterday") {
    date = yesterdayYMD(null, 'UTC');
    await updateFacebookInsights(date);
    date = dayBeforeYesterdayYMD(null, 'UTC');
    await updateFacebookInsights(date);
    // date = yesterdayYMD();
  }
  await updateFacebookData(todayYMD())
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

const facebookPartitionsJob = new CronJob(
  Rules.PARTITIONS_DAILY,
  updateFacebookPartitions
)

async function updateFacebookPartitions() {
  await updateTablePartitions('facebook_partitioned')
}

const initializeFBCron = async () => {
  // For efficiency the table is a partitioned table.
  // The partitions are created in advance.
  // This cron job updates the partitions.
  // It always keeps the last 60 days of data.

  // Update Facebook data every interval
  if (!disableCron) {
    facebookPartitionsJob.start();
    newFacebookYesterdayCron.start();
    facebookInsisghtsJob.start();
    facebookAfterMidnight.start();
    facebookAfternoon.start();
  }
};

module.exports = {
  initializeFBCron,
};
