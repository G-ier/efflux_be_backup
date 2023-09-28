// Third party imports
const { CronJob } = require("cron");

// Local application imports
const { todayYMD, yesterdayYMD, dayBeforeYesterdayYMD } = require("../../../shared/helpers/calendar");
const { sendSlackNotification } = require("../../../shared/lib/SlackNotificationService");
const CompositeService = require("../services/CompositeService");
const {
  TIKTOK_UPDATE_TODAY_REGULAR_CRON,
  TIKTOK_UPDATE_YESTERDAY_BEFORE_MIDNIGHT_CRON,
  TIKTOK_UPDATE_YESTERDAY_AFTER_MIDNIGHT_CRON,
  TIKTOK_UPDATE_YESTERDAY_AFTER_MIDNIGHT_2_CRON,
} = require("./rules");
const { dataUpdatesLogger } = require("../../../shared/lib/WinstonLogger");

const disableGeneralCron = process.env.DISABLE_CRON === "true" || process.env.DISABLE_CRON !== "false";
const disableTikTokCron = process.env.DISABLE_TIKTOK_CRON === "true" || process.env.DISABLE_TIKTOK_CRON !== "false";
const compositeService = new CompositeService();

async function updateTikTokData(day) {
  dataUpdatesLogger.info(`STARTED | TIKTOK | ${day}`);
  try {
    if (day === "today") {
      await compositeService.updateTikTokData(todayYMD());
    } else if (day === "yesterday") {
      await compositeService.updateTikTokData(yesterdayYMD());
      await compositeService.updateTikTokData(dayBeforeYesterdayYMD());
    }
    dataUpdatesLogger.info(`COMPLETED | TIKTOK | ${day}`);
  } catch (error) {
    dataUpdatesLogger.warn(`FAILED | TIKTOK | ${day} | ${error}`);
    await sendSlackNotification(`FAILED | TIKTOK | ${day}`);
    console.log(error);
  }
}

const updateYesterdayDataBeforeMidnightPST = new CronJob(TIKTOK_UPDATE_YESTERDAY_BEFORE_MIDNIGHT_CRON, async () => {
  await updateTikTokData("yesterday");
});

const updateYesterdayDataAfterMidnightPST = new CronJob(TIKTOK_UPDATE_YESTERDAY_AFTER_MIDNIGHT_CRON, async () => {
  await updateTikTokData("yesterday");
});

const updateYesterdayDataAfterMidnightPST2 = new CronJob(TIKTOK_UPDATE_YESTERDAY_AFTER_MIDNIGHT_2_CRON, async () => {
  await updateTikTokData("yesterday");
});

const updateTodayDataRegular = new CronJob(TIKTOK_UPDATE_TODAY_REGULAR_CRON, async () => {
  await updateTikTokData("today");
});

const initializeTikTokCron = async () => {
  // If both are disabled, return immediately
  if (disableGeneralCron && disableTikTokCron) return;

  updateYesterdayDataBeforeMidnightPST.start();
  updateYesterdayDataAfterMidnightPST.start();
  updateYesterdayDataAfterMidnightPST2.start();
  updateTodayDataRegular.start();
};

module.exports = initializeTikTokCron;
