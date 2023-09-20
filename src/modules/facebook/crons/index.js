// Third party imports
const { CronJob }                                                = require('cron');

// Local application imports
const { todayYMD, yesterdayYMD, dayBeforeYesterdayYMD }          = require('../../../shared/helpers/calendar');
const { sendSlackNotification }                                  = require("../../../shared/lib/SlackNotificationService");
const CompositeService                                           = require('../services/CompositeService');
const {
  FACEBOOK_UPDATE_TODAY_REGULAR_CRON,
  FACEBOOK_UPDATE_YESTERDAY_AFTER_MIDNIGHT_CRON,
  FACEBOOK_UPDATE_YESTERDAY_BEFORE_MIDNIGHT_CRON,
  FACEBOOK_UPDATE_YESTERDAY_AFTER_MIDNIGHT_2_CRON
}                                                                = require('./rules');
const { dataUpdatesLogger }                                      = require('../../../shared/lib/WinstonLogger');

const disableGeneralCron          = process.env.DISABLE_CRON === 'true' || process.env.DISABLE_CRON !== 'false';
const disableFacebookCron         = process.env.DISABLE_FACEBOOK_CRON === 'true' || process.env.DISABLE_FACEBOOK_CRON !== 'false';
const compositeService            = new CompositeService();

async function updateFacebookData(day) {

  const insightsUpdate = {
    updatePixels: false,
    updateCampaigns: false,
    updateAdsets: false,
    updateInsights: true,
  }
  try {
    dataUpdatesLogger.info(`STARTED | FACEBOOK | ${day}`);
    await compositeService.updateFacebookData(yesterdayYMD(null, 'UTC'), insightsUpdate);
    if (day === "today")
      await compositeService.updateFacebookData(todayYMD('UTC'), insightsUpdate);
    else if (day === "yesterday")
      await compositeService.updateFacebookData(dayBeforeYesterdayYMD(null, 'UTC'), insightsUpdate);

    await compositeService.updateFacebookData(todayYMD(), {
      updatePixels: true,
      updateCampaigns: true,
      updateAdsets: true,
      updateInsights: true,
    });
    dataUpdatesLogger.info(`COMPLETED | FACEBOOK | ${day}`);
  } catch (error) {
    dataUpdatesLogger.warn(`FAILED | FACEBOOK | ${day} | ${error}`);
    await sendSlackNotification(`FAILED | FACEBOOK | ${day}`)
    console.log(error);
  }
}

const updateYesterdayDataBeforeMidnightPST = new CronJob(
  FACEBOOK_UPDATE_YESTERDAY_BEFORE_MIDNIGHT_CRON,
  (async () => {
    await updateFacebookData('yesterday');
  }
));

const updateYesterdayDataAfterMidnightPST = new CronJob(
  FACEBOOK_UPDATE_YESTERDAY_AFTER_MIDNIGHT_CRON,
  (async () => {
    await updateFacebookData('yesterday');
  }
));

const updateYesterdayDataAfterMidnightPST2 = new CronJob(
  FACEBOOK_UPDATE_YESTERDAY_AFTER_MIDNIGHT_2_CRON,
  (async () => {
    await updateFacebookData('yesterday');
  }
));

const updateTodayDataRegular = new CronJob(
  FACEBOOK_UPDATE_TODAY_REGULAR_CRON, // '28 * * * *',
  (async () => {
    await updateFacebookData('today');
  }
));

const initializeFacebookCron = () => {

  // If both are disabled, return immediately
  if (disableGeneralCron && disableFacebookCron) return;

  updateYesterdayDataBeforeMidnightPST.start();
  updateYesterdayDataAfterMidnightPST.start();
  updateYesterdayDataAfterMidnightPST2.start();
  updateTodayDataRegular.start();

}

module.exports = initializeFacebookCron;
