// Third party imports
const { CronJob }                                                = require('cron');

// Local application imports
const { todayYMD, yesterdayYMD }                                 = require('../../../shared/helpers/calendar');
const { sendSlackNotification }                                  = require("../../../shared/lib/SlackNotificationService");
const FFDataService                                              = require('../services/FFDataService');
const { dataUpdatesLogger }                                      = require('../../../shared/lib/WinstonLogger');
const {
  FUNNEL_FLUX_REGULAR_COST_UPDATE_CRON
}                                                                = require('./rules');
const EnvironmentVariablesManager                                = require('../../../shared/services/EnvironmentVariablesManager');

const DISABLE_CRON                = EnvironmentVariablesManager.getEnvVariable('DISABLE_CRON')
const DISABLE_FUNNEL_FLUX_CRON    = EnvironmentVariablesManager.getEnvVariable('DISABLE_FUNNEL_FLUX_CRON')
const disableGeneralCron          = DISABLE_CRON === 'true' || DISABLE_CRON !== 'false';
const disableFunnelFluxCron       = DISABLE_FUNNEL_FLUX_CRON === 'true' || DISABLE_FUNNEL_FLUX_CRON !== 'false';
const funnelFluxService           = new FFDataService();

// This updates the cost of every linkage between funnels and traffic sources in our database
const updateFunnelFluxTodayCostsRegular = new CronJob(
  FUNNEL_FLUX_REGULAR_COST_UPDATE_CRON,
  (async () => {
    try {
      dataUpdatesLogger.info(`STARTED | FUNNEL_FLUX COST | ${todayYMD()}`)
      await funnelFluxService.updateTrafficSegments(yesterdayYMD(), todayYMD(), "tiktok");
      dataUpdatesLogger.info(`COMPLETED | FUNNEL_FLUX COST | ${todayYMD()}`)
    } catch (error) {
      dataUpdatesLogger.warn(`FAILED | FUNNEL_FLUX COST | ${todayYMD()} | ${error}`)
      await sendSlackNotification(`FAILED | FUNNEL_FLUX COST | ${todayYMD()}`)
      console.log(error);
    }
  })
);

const initializeFunnelFluxCron = async () => {

  // If both are disabled, return immediately
  if (disableGeneralCron && disableFunnelFluxCron) return;

  updateFunnelFluxTodayCostsRegular.start();
};

module.exports = initializeFunnelFluxCron;
