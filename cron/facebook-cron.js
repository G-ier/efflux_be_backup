const CronJob = require("cron").CronJob;
const { todayYMD, yesterdayYMD, todayHH } = require("../common/day");
const Rules = require("../constants/cron");
const { updateFacebookInsights, updateFacebookData } = require("../controllers/facebookController");

const disableCron = process.env.DISABLE_CRON === "true";

async function updateFacebookInsightsJob(day) {

  let date;
  if (day === "today") {
    // date = todayYMD();
    date = todayYMD('UTC');
  }
  else if (day === "yesterday") {
    date = yesterdayYMD('UTC');
    // date = yesterdayYMD();
  }
  await updateFacebookInsights(date);
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
  Rules.FB_REGULAR,
  updateFacebookInsightsJob.bind(null, "today"),
);

const facebookDataJob = new CronJob(
  Rules.FB_HOURLY,
  updateFacebookDataJob
)

const initializeFBCron = () => {
  if (!disableCron) {
    newFacebookYesterdayCron.start();
    facebookInsisghtsJob.start();
    facebookAfterMidnight.start();
    facebookAfternoon.start();
    facebookDataJob.start();
  }

  // DEBUG: uncomment to test immediately
  // updateFacebookData('today').then(() => {console.log('debug done')});
};

module.exports = {
  initializeFBCron,
};
