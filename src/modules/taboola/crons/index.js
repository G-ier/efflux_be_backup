// Third party imports
const { CronJob }                                                = require('cron');
require("dotenv").config();

// Local application imports
const { todayYMD }          = require('../../../shared/helpers/calendar');
const { sendSlackNotification }                                  = require("../../../shared/lib/SlackNotificationService");
const CompositeService                                           = require('../services/CompositeService');
const TABOOLA_UPDATE_TODAY_REGULAR_CRON = require('./rules');

const { dataUpdatesLogger }                                      = require('../../../shared/lib/WinstonLogger');
const EnvironmentVariablesManager                                = require('../../../shared/services/EnvironmentVariablesManager');
const DISABLE_CRON                = EnvironmentVariablesManager.getEnvVariable('DISABLE_CRON')
const DISABLE_TABOOLA_CRON       = EnvironmentVariablesManager.getEnvVariable('DISABLE_TABOOLA_CRON')
const disableGeneralCron          = DISABLE_CRON === 'true' || DISABLE_CRON !== 'false';
const disableTaboolaCron         = DISABLE_TABOOLA_CRON === 'true' || DISABLE_TABOOLA_CRON !== 'false';
const compositeService            = new CompositeService();

async function updateTaboolaData(day) {

    try {
      dataUpdatesLogger.info(`STARTED | TABOOLA | ${day}`);
      await compositeService.syncUserAccountsData(todayYMD(), todayYMD());
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
      await updateTaboolaData('today');
    }
  ));


const initializeTaboolaCron = () => {

    // If both are disabled, return immediately
    if (disableGeneralCron && disableTaboolaCron) return;

    updateTodayDataRegular.start();

}

 module.exports = initializeTaboolaCron;
