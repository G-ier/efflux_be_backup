const EnvironmentVariablesManager = require('../../../shared/services/EnvironmentVariablesManager');
const environment = EnvironmentVariablesManager.getEnvVariable('CRON_ENVIRONMENT') === 'production' ? 'prod' : 'staging'

const TONIC_UPDATE_2_DAYS_AGO_CRON = '15 8 * * *'
const TONIC_UPDATE_YESTERDAY_AFTER_MIDNIGHT_CRON = '4 11 * * *'
const TONIC_UPDATE_YESTERDAY_AT_NOON_CRON = '4 17 * * *'
const TONIC_UPDATE_TODAY_REGULAR_CRON = environment === 'prod' ? '*/15 * * * *' : '0 * * * *'

module.exports = {
  TONIC_UPDATE_2_DAYS_AGO_CRON,
  TONIC_UPDATE_YESTERDAY_AFTER_MIDNIGHT_CRON,
  TONIC_UPDATE_YESTERDAY_AT_NOON_CRON,
  TONIC_UPDATE_TODAY_REGULAR_CRON
};
