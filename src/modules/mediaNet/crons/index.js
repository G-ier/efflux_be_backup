// Third party imports
const { CronJob }                                                = require('cron');

// Local application imports
const { todayYMD, yesterdayYMD, dayBeforeYesterdayYMD }          = require('../../../shared/helpers/calendar');
const InsightService                                           = require('../services/InsightService');
const { sendSlackNotification }                                  = require("../../../shared/lib/SlackNotificationService");
const {
  MEDIANET_UPDATE_2_DAYS_AGO_CRON,
  MEDIANET_UPDATE_YESTERDAY_AFTER_MIDNIGHT_CRON,
  MEDIANET_UPDATE_YESTERDAY_AT_NOON_CRON,
  MEDIANET_UPDATE_TODAY_REGULAR_CRON
}                                                                = require('./rules');
const { dataUpdatesLogger }                                      = require('../../../shared/lib/WinstonLogger');
const EnvironmentVariablesManager                                = require('../../../shared/services/EnvironmentVariablesManager');

const DISABLE_CRON                                               = EnvironmentVariablesManager.getEnvVariable('DISABLE_CRON')
const DISABLE_MEDIANET_CRON                                      = EnvironmentVariablesManager.getEnvVariable('DISABLE_MEDIANET_CRON')
const disableGeneralCron                                         = DISABLE_CRON === 'true' || DISABLE_CRON !== 'false';
const disableMediaNetCron                                        = DISABLE_MEDIANET_CRON === 'true' || DISABLE_MEDIANET_CRON !== 'false';
const insightService                                           = new InsightService();


const updateMediaNetData = async (date) => {
    try {
      dataUpdatesLogger.info(`STARTED | MEDIANET | ${date}`)
      await insightService.syncInsights(date, date);
      dataUpdatesLogger.info(`FINISHED | MEDIANET | ${date}`)
    } catch (error) {
      dataUpdatesLogger.warn(`FAILED | MEDIANET | ${date} | ${error}`)
      console.log(error);
      await sendSlackNotification(`FAILED | MEDIANET |  ${date}`)
    }
  }
  
  const update2DaysAgoData = new CronJob(
    MEDIANET_UPDATE_2_DAYS_AGO_CRON,
    (async () => {
      await updateMediaNetData(dayBeforeYesterdayYMD().replace(/-/g, ''));
    }
  ));
  
  const updateYesterdayDataAfterMidnightPST = new CronJob(
    MEDIANET_UPDATE_YESTERDAY_AFTER_MIDNIGHT_CRON,
    (async () => {
      await updateMediaNetData(yesterdayYMD().replace(/-/g, ''));
    }
  ));
  
  const updateYesterdayDataAtNoonPST = new CronJob(
    MEDIANET_UPDATE_YESTERDAY_AT_NOON_CRON,
    (async () => {
      await updateMediaNetData(yesterdayYMD().replace(/-/g, ''));
    }
  ));
  
  const updateTodayDataRegular = new CronJob(
    MEDIANET_UPDATE_TODAY_REGULAR_CRON,
    (async () => {
      console.log('MEDIANET_UPDATE_TODAY_REGULAR_CRON')
      await updateMediaNetData(todayYMD().replace(/-/g, ''));
    }
  ));
  
  const initializeMediaNetCron = () => {
  
    // If both are disabled, return immediately
    if (disableGeneralCron && disableMediaNetCron) return;
  
    update2DaysAgoData.start();
    updateYesterdayDataAfterMidnightPST.start();
    updateYesterdayDataAtNoonPST.start();
    updateTodayDataRegular.start();
  
  }
  
  module.exports = initializeMediaNetCron;