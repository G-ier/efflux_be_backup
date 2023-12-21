// Third party imports
const { CronJob }                                                = require('cron');

// Local application imports
const { todayYMD, yesterdayYMD, dayBeforeYesterdayYMD }          = require('../../../../shared/helpers/calendar');
const { sendSlackNotification }                                  = require("../../../../shared/lib/SlackNotificationService");
const AggregatesService                                          = require('../../services/AggregatesService');
const { AVAILABLE_NETWORKS, AVAILABLE_TRAFFIC_SOURCES }          = require('../../constants');
const {
  AGGREGATES_UPDATE_TODAY_REGULAR_CRON,
  SEDO_AGGREGATES_UPDATE_YESTERDAY_AFTER_MIDNIGHT_AND_NOON,
  CROSSROADS_AGGREGATES_UPDATE_YESTERDAY_AFTER_MIDNIGHT_AND_NOON,
  TONIC_AGGREGATES_UPDATE_YESTERDAY_AFTER_MIDNIGHT_AND_NOON
}                                                                = require('./rules');
const { dataUpdatesLogger }                                      = require("../../../../shared/lib/WinstonLogger");
const EnvironmentVariablesManager                                = require('../../../../shared/services/EnvironmentVariablesManager');

const DISABLE_CRON = EnvironmentVariablesManager.getEnvVariable('DISABLE_CRON')
const DISABLE_AGGREGATES_UPDATE_CRON = EnvironmentVariablesManager.getEnvVariable('DISABLE_AGGREGATES_UPDATE_CRON')

const disableGeneralCron          = DISABLE_CRON === 'true' || DISABLE_CRON !== 'false';
const disableAggregatesUpdateCron = DISABLE_AGGREGATES_UPDATE_CRON === 'true' || DISABLE_AGGREGATES_UPDATE_CRON !== 'false';
const aggregatesService           = new AggregatesService();

async function updateCompiledAggregates(day="today", network, trafficSource) {
  dataUpdatesLogger.info(`STARTED | AGGREGATES | ${day} | ${network} | ${trafficSource}`);
  try {
    let startDate, endDate;
    if (day === "today") {
      startDate       = yesterdayYMD();
      endDate         = todayYMD();
    } else if (day === "yesterday") {
      startDate       = dayBeforeYesterdayYMD();
      endDate         = yesterdayYMD();
    }
    await aggregatesService.updateAggregates(network, trafficSource, startDate, endDate);
    dataUpdatesLogger.info(`COMPLETED | AGGREGATES | ${day} | ${network} | ${trafficSource}`);
  } catch (e) {
    dataUpdatesLogger.warn(`FAILED | AGGREGATES | ${day} | ${network} | ${trafficSource} | ${e}`);
    await sendSlackNotification(`FAILED | AGGREGATES | ${day} | ${network} | ${trafficSource}`);
    console.log(e);
  }
}

const updateTodayDataRegular = new CronJob(
  AGGREGATES_UPDATE_TODAY_REGULAR_CRON,
  (async () => {
    for (const network of AVAILABLE_NETWORKS) {
      for (const trafficSource of AVAILABLE_TRAFFIC_SOURCES) {
        await updateCompiledAggregates("today", network, trafficSource);
      }
    }
  }
));

const updateSedoDataYesterday = new CronJob(
  SEDO_AGGREGATES_UPDATE_YESTERDAY_AFTER_MIDNIGHT_AND_NOON,
  (async () => {
    for (const trafficSource of AVAILABLE_TRAFFIC_SOURCES) {
      await updateCompiledAggregates("yesterday", "sedo", trafficSource);
    }
  }
));

const updateTonicDataYesterday = new CronJob(
  TONIC_AGGREGATES_UPDATE_YESTERDAY_AFTER_MIDNIGHT_AND_NOON,
  (async () => {
    for (const trafficSource of AVAILABLE_TRAFFIC_SOURCES) {
      await updateCompiledAggregates("yesterday", "tonic", trafficSource);
    }
  }
));

const updateCrossroadsDataYesterday = new CronJob(
  CROSSROADS_AGGREGATES_UPDATE_YESTERDAY_AFTER_MIDNIGHT_AND_NOON,
  (async () => {
    for (const trafficSource of AVAILABLE_TRAFFIC_SOURCES) {
      await updateCompiledAggregates("yesterday", "crossroads", trafficSource);
    }
  }

));

const initializeAggregatesUpdateCron = async () => {

  // If both are disabled, return immediately
  if (disableGeneralCron && disableAggregatesUpdateCron) return;

  updateTodayDataRegular.start();
  updateSedoDataYesterday.start();
  updateTonicDataYesterday.start();
  updateCrossroadsDataYesterday.start();

};

module.exports = initializeAggregatesUpdateCron;
