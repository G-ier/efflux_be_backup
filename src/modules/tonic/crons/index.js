// Third party imports
const { CronJob }                                                = require('cron');

// Local application imports
const { todayYMD, yesterdayYMD, dayBeforeYesterdayYMD }          = require('../../../shared/helpers/calendar');
const CompositeService                                           = require('../services/CompositeService');
const { sendSlackNotification }                                  = require("../../../shared/lib/SlackNotificationService");
const {
  TONIC_UPDATE_2_DAYS_AGO_CRON,
  TONIC_UPDATE_YESTERDAY_AFTER_MIDNIGHT_CRON,
  TONIC_UPDATE_YESTERDAY_AT_NOON_CRON,
  TONIC_UPDATE_TODAY_REGULAR_CRON
}                                                                = require('./rules');
const { dataUpdatesLogger }                                      = require('../../../shared/lib/WinstonLogger');
const EnvironmentVariablesManager                                = require('../../../shared/services/EnvironmentVariablesManager');

const DISABLE_CRON                                               = EnvironmentVariablesManager.getEnvVariable('DISABLE_CRON')
const DISABLE_TONIC_CRON                                         = EnvironmentVariablesManager.getEnvVariable('DISABLE_TONIC_CRON')
const disableGeneralCron                                         = DISABLE_CRON === 'true' || DISABLE_CRON !== 'false';
const disableTonicCron                                           = DISABLE_TONIC_CRON === 'true' || DISABLE_TONIC_CRON !== 'false';
const compositeService                                           = new CompositeService();

const updateTonicData = async (date) => {
  try {
    dataUpdatesLogger.info(`STARTED | TONIC | ${date}`)
    await compositeService.updateData(date);
    dataUpdatesLogger.info(`FINISHED | TONIC | ${date}`)
  } catch (error) {
    dataUpdatesLogger.warn(`FAILED | TONIC | ${date} | ${error}`)
    console.log(error);
    await sendSlackNotification(`FAILED | TONIC |  ${date}`)
  }
}

const update2DaysAgoData = new CronJob(
  TONIC_UPDATE_2_DAYS_AGO_CRON,
  (async () => {
    await updateTonicData(dayBeforeYesterdayYMD());
  }
));

const updateYesterdayDataAfterMidnightPST = new CronJob(
  TONIC_UPDATE_YESTERDAY_AFTER_MIDNIGHT_CRON,
  (async () => {
    await updateTonicData(yesterdayYMD());
  }
));

const updateYesterdayDataAtNoonPST = new CronJob(
  TONIC_UPDATE_YESTERDAY_AT_NOON_CRON,
  (async () => {
    await updateTonicData(yesterdayYMD());
  }
));

const updateTodayDataRegular = new CronJob(
  TONIC_UPDATE_TODAY_REGULAR_CRON,
  (async () => {
    console.log('TONIC_UPDATE_TODAY_REGULAR_CRON')
    await updateTonicData(todayYMD());
  }
));

const initializeTonicCron = () => {

  // If both are disabled, return immediately
  if (disableGeneralCron && disableTonicCron) return;

  update2DaysAgoData.start();
  updateYesterdayDataAfterMidnightPST.start();
  updateYesterdayDataAtNoonPST.start();
  updateTodayDataRegular.start();

}

module.exports = initializeTonicCron;
