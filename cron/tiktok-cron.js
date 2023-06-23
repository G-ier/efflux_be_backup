const { updateTikTokInsights, updateTikTokData }  = require("../controllers/tikTokController");
const calendar                                    = require("../common/day");
const Rules                                       = require("../constants/cron");
const CronJob                                     = require("cron").CronJob;

async function updateTikTokInsightsJob(day) {

  let date;
  // Update the insights for today, yesterday and tomorrow
  if (day === "today") {
    date = calendar.yesterdayYMD(null, 'UTC');
    await updateTikTokInsights(date);
    date = calendar.todayYMD('UTC');
    await updateTikTokInsights(date);
    date = calendar.tomorrowYMD(null, 'UTC');
    await updateTikTokInsights(date);
  } else if (day === "yesterday") {
    date = calendar.yesterdayYMD(null, 'UTC');
    await updateTikTokInsights(date);
    date = calendar.dayBeforeYesterdayYMD(null, 'UTC');
    await updateTikTokInsights(date);
  }
  await updateTikTokData(calendar.todayYMD())
  // Either create spreadsheets or populate the dashboard
}

const TiktokYesterdayCron = new CronJob(
  Rules.FB_DAILY,
  updateTikTokInsightsJob.bind(null, "yesterday"),
);

const RegularTikTokInsightsJob = new CronJob(
  Rules.SEDO_REGULAR,
  updateTikTokInsightsJob.bind(null, "today"),
);

const TikTokAfterMidnight = new CronJob(
  Rules.AFTER_MIDNIGHT,
  updateTikTokInsightsJob.bind(null, "yesterday"),
);

const TikTokAfternoon = new CronJob(
  Rules.FB_AFTERNOON,
  updateTikTokInsightsJob.bind(null, "yesterday"),
);

const initializeTTCron = async () => {

  const disableCron = process.env.DISABLE_CRON === "true";

  if (!disableCron) {
    RegularTikTokInsightsJob.start();
    TiktokYesterdayCron.start();
    TikTokAfterMidnight.start();
    TikTokAfternoon.start();
  }

};

module.exports = {
  initializeTTCron
};
