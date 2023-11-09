// Third party imports
const { CronJob }                                                = require('cron');
require("dotenv").config();

// Local application imports
const { todayYMD, yesterdayYMD, dayBeforeYesterdayYMD }          = require('../../../shared/helpers/calendar');
const { sendSlackNotification }                                  = require("../../../shared/lib/SlackNotificationService");
const CompositeService                                           = require('../services/CompositeService');
const PageService                                                = require('../services/PageService');
const {
  FACEBOOK_UPDATE_TODAY_REGULAR_CRON,
  FACEBOOK_UPDATE_YESTERDAY_AFTER_MIDNIGHT_CRON,
  FACEBOOK_UPDATE_YESTERDAY_BEFORE_MIDNIGHT_CRON,
  FACEBOOK_UPDATE_YESTERDAY_AFTER_MIDNIGHT_2_CRON,
  FACEBOOK_UPDATE_EVERY_SIX_HOURS_CRON
}                                                                = require('./rules');
const { dataUpdatesLogger }                                      = require('../../../shared/lib/WinstonLogger');
const EnvironmentVariablesManager                                = require('../../../shared/services/EnvironmentVariablesManager');

const DISABLE_CRON                = EnvironmentVariablesManager.getEnvVariable('DISABLE_CRON')
const DISABLE_FACEBOOK_CRON       = EnvironmentVariablesManager.getEnvVariable('DISABLE_FACEBOOK_CRON')
const disableGeneralCron          = DISABLE_CRON === 'true' || DISABLE_CRON !== 'false';
const disableFacebookCron         = DISABLE_FACEBOOK_CRON === 'true' || DISABLE_FACEBOOK_CRON !== 'false';
const compositeService            = new CompositeService();
const pageService                 = new PageService();

async function updateFacebookData(day) {

  const insightsUpdate = {
    updatePixels: false,
    updateCampaigns: false,
    updateAdsets: false,
    updateInsights: true,
  }
  try {
    dataUpdatesLogger.info(`STARTED | FACEBOOK | ${day}`);
    await compositeService.updateFacebookData(yesterdayYMD(null, 'UTC'), yesterdayYMD(null, 'UTC'), insightsUpdate);
    if (day === "today")
      await compositeService.updateFacebookData(todayYMD('UTC'), todayYMD('UTC'), insightsUpdate);
    else if (day === "yesterday")
      await compositeService.updateFacebookData(dayBeforeYesterdayYMD(null, 'UTC'), dayBeforeYesterdayYMD(null, 'UTC'), insightsUpdate);
    await compositeService.updateFacebookData(todayYMD(), todayYMD(), {
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

const updatePagesRegular = new CronJob(
FACEBOOK_UPDATE_EVERY_SIX_HOURS_CRON,
  (async () =>{
    try{
    await pageService.syncPages(process.env.FACEBOOK_PAGE_ACCESS_TOKEN ,process.env.FACEBOOK_BUSINESS_IDS.split(','));

    dataUpdatesLogger.info(`COMPLETED | PAGES | today`);
    } catch (error) {
    dataUpdatesLogger.warn(`FAILED | PAGES | today | ${error}`);
    await sendSlackNotification(`FAILED | PAGES | today`)
    console.log(error);
    };
  }
  ));

const initializeFacebookCron = () => {

  // If both are disabled, return immediately
  if (disableGeneralCron && disableFacebookCron) return;

  updateYesterdayDataBeforeMidnightPST.start();
  updateYesterdayDataAfterMidnightPST.start();
  updateYesterdayDataAfterMidnightPST2.start();
  updateTodayDataRegular.start();
  updatePagesRegular.start();
}

module.exports = initializeFacebookCron;
