const EnvironmentVariablesManager = require('../../../shared/services/EnvironmentVariablesManager');
const environment = EnvironmentVariablesManager.getEnvVariable('CRON_ENVIRONMENT') === 'production' ? 'prod' : 'staging'

const SEDO_UPDATE_YESTERDAY = '20 0,7,9,11 * * *'
const SEDO_UPDATE_TODAY_REGULAR_CRON = environment === 'prod' ? '*/15 * * * *' : '0 * * * *'

module.exports = {
  SEDO_UPDATE_TODAY_REGULAR_CRON,
  SEDO_UPDATE_YESTERDAY
};
