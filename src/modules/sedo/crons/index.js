// Third party imports
const { CronJob }                                                = require('cron');

// Local application imports
const { todayYMD, yesterdayYMD }                                 = require('../../../shared/helpers/calendar');
const { sendSlackNotification }                                  = require("../../../shared/lib/SlackNotificationService");
const InsightsService                                            = require('../services/InsightsService');
const {
  SEDO_UPDATE_YESTERDAY,
  SEDO_UPDATE_TODAY_REGULAR_CRON
}                                                                = require('./rules');
const { SEDO_TZ }                                                = require('../constants');
const { dataUpdatesLogger }                                      = require('../../../shared/lib/WinstonLogger');
const EnvironmentVariablesManager                                = require('../../../shared/services/EnvironmentVariablesManager');

const DISABLE_CRON                = EnvironmentVariablesManager.getEnvVariable('DISABLE_CRON')
const DISABLE_SEDO_CRON           = EnvironmentVariablesManager.getEnvVariable('DISABLE_SEDO_CRON')
const disableGeneralCron          = DISABLE_CRON === 'true' || DISABLE_CRON !== 'false';
const disableSedoCron             = DISABLE_SEDO_CRON === 'true' || DISABLE_SEDO_CRON !== 'false';
const insightsService             = new InsightsService();

const updateSedo = async (date) => {
  try {
    dataUpdatesLogger.info(`STARTED | SEDO | ${date}`)
    await insightsService.syncSedoInsights(date);
    dataUpdatesLogger.info(`COMPLETED | SEDO | ${date}`)
  } catch (error) {
    dataUpdatesLogger.warn(`FAILED | SEDO | ${date} | ${error}`)
    await sendSlackNotification(`FAILED | SEDO | ${date}`)
    console.log(error);
  }
}

const updateSedoYesterdayData = new CronJob(
  SEDO_UPDATE_YESTERDAY,
  (async () => {
    await updateSedo(yesterdayYMD(null, SEDO_TZ));
  }
));


const initializeSedoCron = () => {
  if (disableGeneralCron && disableSedoCron) return;
  updateSedoYesterdayData.start();
}

module.exports = initializeSedoCron;
