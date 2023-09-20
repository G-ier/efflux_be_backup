const calendar                        = require('../../common/day');
const CronJob                         = require('cron').CronJob;
const { ruleThemAllQuery }            = require('../services/insightsService');
const { updateInsightsOnDatabase }    = require('../controllers/insightsController');
const { sendSlackNotification }       = require('../services/slackNotificationService');

const regularInsightsUpdateRule = "* * * * *"
const yesterdayInsightsUpdateRule = "20 11,17 * * *"

async function updateInsightsJob(day = "today", network, trafficSource) {

  if (day !== "today" && day !== "yesterday") {
    throw new Error("Invalid day")
  }

  let startDate, endDate;
  if (day === "today") {
    startDate       = calendar.yesterdayYMD();
    endDate         = calendar.todayYMD();
  } else if (day === "yesterday") {
    startDate       = calendar.dayBeforeYesterdayYMD();
    endDate         = calendar.yesterdayYMD();
  }

  console.log("Updating insights for", endDate)
  try {
    const { rows } = await ruleThemAllQuery(network, trafficSource, startDate, endDate)
    await updateInsightsOnDatabase(rows, trafficSource)
  } catch (error) {
    console.log("Error updating insights", error)
    await sendSlackNotification(`Error updating insights: ${error.message}`)
  }

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
