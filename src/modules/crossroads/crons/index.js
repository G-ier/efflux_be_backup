// Third party imports
const { CronJob }                                                = require('cron');

// Local application imports
const { todayYMD, yesterdayYMD, dayBeforeYesterdayYMD }          = require('../../../shared/helpers/calendar');
const { sendSlackNotification }                                  = require("../../../shared/lib/SlackNotificationService");
const CompositeService                                           = require('../services/CompositeService');
const { CROSSROADS_ACCOUNTS }                                    = require('../constants');
const {
  CROSSROADS_UPDATE_2_DAYS_AGO_CRON,
  CROSSROADS_UPDATE_YESTERDAY_AFTER_MIDNIGHT_CRON,
  CROSSROADS_UPDATE_YESTERDAY_AT_NOON_CRON,
  CROSSROADS_UPDATE_TODAY_REGULAR_CRON
}                                                                = require('./rules');
const { dataUpdatesLogger }                                      = require('../../../shared/lib/WinstonLogger');
const EnvironmentVariablesManager                                = require('../../../shared/services/EnvironmentVariablesManager');

const DISABLE_CRON                = EnvironmentVariablesManager.getEnvVariable('DISABLE_CRON')
const DISABLE_CROSSROADS_CRON     = EnvironmentVariablesManager.getEnvVariable('DISABLE_CROSSROADS_CRON')
const disableGeneralCron          = DISABLE_CRON === 'true' || DISABLE_CRON !== 'false';
const disableCrossroadsCron       = DISABLE_CROSSROADS_CRON === 'true' || DISABLE_CROSSROADS_CRON !== 'false';
const compositeService            = new CompositeService();

const TESTING_CAMPAIGN_IDS = EnvironmentVariablesManager.getEnvVariable('TESTING_CAMPAIGN_IDS');
const ParsedTestCampaignIds = TESTING_CAMPAIGN_IDS ? JSON.parse(TESTING_CAMPAIGN_IDS.replace(/'/g, '"')) : []

const updateCrossroadsForAllAccounts = async (request_date) => {
  const account = CROSSROADS_ACCOUNTS[0];
  try {

    dataUpdatesLogger.info(`STARTED | CROSSROADS | ${request_date}`)
    const saveAggregated = true; const saveRawData = true; const saveRawDataToFile = false; const campaignIdRestrictions = [];

    await compositeService.updateData(account, request_date,
      saveAggregated, saveRawData, saveRawDataToFile, campaignIdRestrictions
    );

    dataUpdatesLogger.info(`COMPLETED | CROSSROADS | ${request_date}`)
  } catch (error) {
    dataUpdatesLogger.warn(`FAILED | CROSSROADS | ${request_date} | ${error}`)
    //await sendSlackNotification(`FAILED | CROSSROADS | ${request_date}`)
    console.log(error);
  }
}

const update2DaysAgoData = new CronJob(
  CROSSROADS_UPDATE_2_DAYS_AGO_CRON,
  (async () => {
    await updateCrossroadsForAllAccounts(dayBeforeYesterdayYMD());
  }
));

const updateYesterdayDataAfterMidnightPST = new CronJob(
  CROSSROADS_UPDATE_YESTERDAY_AFTER_MIDNIGHT_CRON,
  (async () => {
    await updateCrossroadsForAllAccounts(yesterdayYMD());
  }
));

const updateYesterdayDataAtNoonPST = new CronJob(
  CROSSROADS_UPDATE_YESTERDAY_AT_NOON_CRON,
  (async () => {
    await updateCrossroadsForAllAccounts(yesterdayYMD());
  }
));

const updateTodayDataRegular = new CronJob(
  CROSSROADS_UPDATE_TODAY_REGULAR_CRON,
  (async () => {
    await updateCrossroadsForAllAccounts(todayYMD());
  }
));

const initializeCrossroadsCron = () => {

  // If both are disabled, return immediately
  if (disableGeneralCron && disableCrossroadsCron) return;

  update2DaysAgoData.start();
  updateYesterdayDataAfterMidnightPST.start();
  updateYesterdayDataAtNoonPST.start();
  updateTodayDataRegular.start();

}


module.exports = initializeCrossroadsCron;
