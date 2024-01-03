const EnvironmentVariablesManager = require('../../../shared/services/EnvironmentVariablesManager');
const environment = EnvironmentVariablesManager.getEnvVariable('CRON_ENVIRONMENT') === 'production' ? 'prod' : 'staging'

const MEDIANET_UPDATE_2_DAYS_AGO_CRON = '15 8 * * *'
const MEDIANET_UPDATE_YESTERDAY_AFTER_MIDNIGHT_CRON = '4 11 * * *'
const MEDIANET_UPDATE_YESTERDAY_AT_NOON_CRON = '4 17 * * *'
const MEDIANET_UPDATE_TODAY_REGULAR_CRON = environment === 'prod' ? '*/15 * * * *' : '*/1 * * * *'

module.exports = {
  MEDIANET_UPDATE_2_DAYS_AGO_CRON,
  MEDIANET_UPDATE_YESTERDAY_AFTER_MIDNIGHT_CRON,
  MEDIANET_UPDATE_YESTERDAY_AT_NOON_CRON,
  MEDIANET_UPDATE_TODAY_REGULAR_CRON
};