const calendar                        = require('../common/day');
const CronJob                         = require('cron').CronJob;
const { ruleThemAllQuery }            = require('../services/insightsService');
const { updateInsightsOnDatabase }    = require('../controllers/insightsController');

const regularInsightsUpdateRule = "8,23,38,53 * * * *"
const yesterdayInsightsUpdateRule = "20 11,17 * * *"

async function updateInsightsJob(day = "today", network, trafficSource) {

  if (day !== "today" && day !== "yesterday") {
    throw new Error("Invalid day")
  }

  let startDate, endDate;
  if (day === "today") {
    startDate       = calendar.yesterdayYMD(null, 'UTC');
    endDate         = calendar.todayYMD('UTC');
  } else if (day === "yesterday") {
    startDate       = calendar.dayBeforeYesterdayYMD(null, 'UTC');
    endDate         = calendar.yesterdayYMD(null, 'UTC');
  }

  console.log("Updating insights for", endDate)

  const { rows } = await ruleThemAllQuery(network, trafficSource, startDate, endDate)
  await updateInsightsOnDatabase(rows, trafficSource)

}

const FacebookInsightsRegularJob = new CronJob(
  regularInsightsUpdateRule,
  updateInsightsJob.bind(null, "today", "crossroads", "facebook"),
);

const FacebookInsightsYesterdayJob = new CronJob(
  yesterdayInsightsUpdateRule,
  updateInsightsJob.bind(null, "yesterday", "crossroads", "facebook"),
);

const TiktokInsightsRegularJob = new CronJob(
  regularInsightsUpdateRule,
  updateInsightsJob.bind(null, "today", "crossroads", "tiktok"),
);

const TiktokInsightsYesterdayJob = new CronJob(
  yesterdayInsightsUpdateRule,
  updateInsightsJob.bind(null, "yesterday", "crossroads", "tiktok"),
);

const initializeInsightsCron = async () => {

  const disableCron = process.env.DISABLE_CRON === "true";

  if (!disableCron) {
    FacebookInsightsRegularJob.start();
    FacebookInsightsYesterdayJob.start();
    TiktokInsightsRegularJob.start();
    TiktokInsightsYesterdayJob.start();
  }

}

module.exports = {
  initializeInsightsCron
}
