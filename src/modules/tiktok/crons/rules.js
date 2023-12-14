const EnvironmentVariablesManager = require('../../../shared/services/EnvironmentVariablesManager');
const environment = EnvironmentVariablesManager.getEnvVariable('CRON_ENVIRONMENT') === 'production' ? 'prod' : 'staging'

const TIKTOK_UPDATE_TODAY_REGULAR_CRON              = environment === 'prod' ?  '*/15 * * * *' : '0 * * * *'
const TIKTOK_UPDATE_YESTERDAY_BEFORE_MIDNIGHT_CRON  = '5 8 * * *'
const TIKTOK_UPDATE_YESTERDAY_AFTER_MIDNIGHT_CRON   = '4 11 * * *'
const TIKTOK_UPDATE_YESTERDAY_AFTER_MIDNIGHT_2_CRON = '5 12 * * *'
const TIKTOK_REPORT_CONVERSIONS_HOURLY_CRON         = '4,19,34,49 * * * *'

module.exports = {
  TIKTOK_UPDATE_TODAY_REGULAR_CRON,
  TIKTOK_UPDATE_YESTERDAY_BEFORE_MIDNIGHT_CRON,
  TIKTOK_UPDATE_YESTERDAY_AFTER_MIDNIGHT_CRON,
  TIKTOK_UPDATE_YESTERDAY_AFTER_MIDNIGHT_2_CRON,
  TIKTOK_REPORT_CONVERSIONS_HOURLY_CRON
}
