// Third party imports
const { CronJob }                                                = require('cron');
require("dotenv").config();

// Local application imports
const { todayYMD, yesterdayYMD, dayBeforeYesterdayYMD }          = require('../../../shared/helpers/calendar');
const { sendSlackNotification }                                  = require("../../../shared/lib/SlackNotificationService");
const CompositeService                                           = require('../services/CompositeService');
const {
  FACEBOOK_UPDATE_TODAY_REGULAR_CRON,
  FACEBOOK_UPDATE_YESTERDAY_AFTER_MIDNIGHT_CRON,
  FACEBOOK_UPDATE_YESTERDAY_BEFORE_MIDNIGHT_CRON,
  FACEBOOK_UPDATE_YESTERDAY_AFTER_MIDNIGHT_2_CRON,
  FACEBOOK_UPDATE_EVERY_SIX_HOURS_CRON,
  FACEBOOK_REPORT_CONVERSIONS_HOUR_CRON,
  FACEBOOK_REPORT_CONVERSIONS_YESTERDAY
}                                                                = require('./rules');
const { dataUpdatesLogger }                                      = require('../../../shared/lib/WinstonLogger');
const EnvironmentVariablesManager                                = require('../../../shared/services/EnvironmentVariablesManager');

const DISABLE_CRON                = EnvironmentVariablesManager.getEnvVariable('DISABLE_CRON')
const DISABLE_FACEBOOK_CRON       = EnvironmentVariablesManager.getEnvVariable('DISABLE_FACEBOOK_CRON')
const CRON_ENVIRONMENT            = EnvironmentVariablesManager.getEnvVariable('CRON_ENVIRONMENT')
const disableGeneralCron          = DISABLE_CRON === 'true' || DISABLE_CRON !== 'false';
const disableFacebookCron         = DISABLE_FACEBOOK_CRON === 'true' || DISABLE_FACEBOOK_CRON !== 'false';
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

async function reportFacebookConversions(date, network) {
  dataUpdatesLogger.info(`STARTED | FACEBOOK - ${network} | ${date} | REPORTING CONVERSIONS`);
  try {
    await compositeService.sendCapiEvents(date, network);
    dataUpdatesLogger.info(`COMPLETED | FACEBOOK - ${network} | ${date} | REPORTING CONVERSIONS`);
  } catch (error) {
    dataUpdatesLogger.warn(`FAILED | FACEBOOK - ${network} | ${date} | REPORTING CONVERSIONS | ${error}`);
    await sendSlackNotification(`FAILED | FACEBOOK - ${network} | ${date} | REPORTING CONVERSIONS`)
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

// TONIC CONVERSION REPORTING
const reportFacebookConversionsToTonicRegular = new CronJob(
  FACEBOOK_REPORT_CONVERSIONS_HOUR_CRON,
  (async () => {
    for (const network of ['tonic']) {
      await reportFacebookConversions(todayYMD(), network);
    }
  }
));

const reportYesterdayTonicFacebookConversions = new CronJob(
  FACEBOOK_REPORT_CONVERSIONS_YESTERDAY,
  (async () => {
    for (const network of ['tonic']) {
      await reportFacebookConversions(yesterdayYMD(), network);
    }
  }
));

// CROSSROADS CONVERSION REPORTING
const reportFacebookConversionsToCrossroadsRegular = new CronJob(
  FACEBOOK_REPORT_CONVERSIONS_HOUR_CRON,
  (async () => {
    for (const network of ['crossroads']) {
      await reportFacebookConversions(todayYMD(), network);
    }
  }
));

const reportYesterdayCrossroadsFacebookConversions = new CronJob(
  FACEBOOK_REPORT_CONVERSIONS_YESTERDAY,
  (async () => {
    for (const network of ['crossroads']) {
      await reportFacebookConversions(yesterdayYMD(), network);
    }
  }
));

const updatePagesRegular = new CronJob(
  FACEBOOK_UPDATE_EVERY_SIX_HOURS_CRON,
  (async () =>{
    try{
      let facebookBusinessIds = process.env.FACEBOOK_BUSINESS_IDS;
      if (typeof facebookBusinessIds === 'string') {
        facebookBusinessIds = JSON.parse(facebookBusinessIds);
      }
      await compositeService.syncPages(facebookBusinessIds);
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

  reportFacebookConversionsToTonicRegular.start()
  reportYesterdayTonicFacebookConversions.start()

  // LEAVE ONLY IN PRODUCTION POST-PRODUCTION MERGE
  if (CRON_ENVIRONMENT === 'production') {
    reportFacebookConversionsToCrossroadsRegular.start()
    reportYesterdayCrossroadsFacebookConversions.start()
  }

}

module.exports = initializeFacebookCron;
