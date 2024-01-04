// Third party imports
const { CronJob }                                                = require('cron');
require("dotenv").config();

// Local application imports
const { todayYMD, yesterdayYMD }                                 = require('../../../shared/helpers/calendar');
const { sendSlackNotification }                                  = require("../../../shared/lib/SlackNotificationService");
const CompositeService                                           = require('../services/CompositeService');
const { TABOOLA_UPDATE_TODAY_REGULAR_CRON,
  TABOOLA_UPDATE_YESTERDAY_CRON,
  TABOOLA_REPORT_CONVERSIONS_YESTERDAY,
  TABOOLA_CAPI_REPORT_REGULAR_CRON
}                                                                = require('./rules');
const { dataUpdatesLogger }                                      = require('../../../shared/lib/WinstonLogger');
const EnvironmentVariablesManager                                = require('../../../shared/services/EnvironmentVariablesManager');

const DISABLE_CRON                = EnvironmentVariablesManager.getEnvVariable('DISABLE_CRON')
const DISABLE_TABOOLA_CRON       = EnvironmentVariablesManager.getEnvVariable('DISABLE_TABOOLA_CRON')
const CRON_ENVIRONMENT            = EnvironmentVariablesManager.getEnvVariable('CRON_ENVIRONMENT')
const disableGeneralCron          = DISABLE_CRON === 'true' || DISABLE_CRON !== 'false';
const disableTaboolaCron         = DISABLE_TABOOLA_CRON === 'true' || DISABLE_TABOOLA_CRON !== 'false';
const compositeService            = new CompositeService();

async function reportTaboolaConversions(date) {
  dataUpdatesLogger.info(`STARTED | TABOOLA - CROSSROADS | ${date} | REPORTING CONVERSIONS`);
  try {
    await compositeService.sendS2SEvents(date);
    dataUpdatesLogger.info(`COMPLETED | TABOOLA - CROSSROADS | ${date} | REPORTING CONVERSIONS`);
  } catch (error) {
    dataUpdatesLogger.warn(`FAILED | TABOOLA - CROSSROADS | ${date} | REPORTING CONVERSIONS | ${error}`);
    await sendSlackNotification(`FAILED | TABOOLA - CROSSROADS | ${date} | REPORTING CONVERSIONS`)
    console.log(error);
  }
}

async function updateTaboolaData(day) {

    try {
      dataUpdatesLogger.info(`STARTED | TABOOLA | ${day}`);
      await compositeService.syncUserAccountsData( day, day);
      dataUpdatesLogger.info(`COMPLETED | TABOOLA | ${day}`);
    } catch (error) {
      dataUpdatesLogger.warn(`FAILED | TABOOLA | ${day} | ${error}`);
      await sendSlackNotification(`FAILED | TABOOLA | ${day}`)
      console.log(error);
    }
}

const updateTodayDataRegular = new CronJob(
    TABOOLA_UPDATE_TODAY_REGULAR_CRON, // '28 * * * *',
    (async () => {
      await updateTaboolaData(todayYMD(), todayYMD());
    }
  ));

const updateYesterdayData = new CronJob(
    TABOOLA_UPDATE_YESTERDAY_CRON, // '28 * * * *',
    (async () => {
      await updateTaboolaData(yesterdayYMD(), yesterdayYMD());
    }
  ));

const reportTaboolaConversionsToCrossroadsRegular = new CronJob(
    TABOOLA_CAPI_REPORT_REGULAR_CRON,
    (async () => {
      await reportTaboolaConversions(todayYMD());
    }
  ));

const reportYesterdayCrossroadsTaboolaConversions = new CronJob(
    TABOOLA_REPORT_CONVERSIONS_YESTERDAY,
    (async () => {
        await reportTaboolaConversions(yesterdayYMD());
    }

));

const initializeTaboolaCron = () => {

    // If both are disabled, return immediately
    if (disableGeneralCron && disableTaboolaCron) return;

    updateTodayDataRegular.start();
    updateYesterdayData.start();
    if (CRON_ENVIRONMENT === 'production') {
      reportTaboolaConversionsToCrossroadsRegular.start();
      reportYesterdayCrossroadsTaboolaConversions.start();
    }
}

module.exports = initializeTaboolaCron;
