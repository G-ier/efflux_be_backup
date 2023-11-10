const EnvironmentVariablesManager = require('../../../shared/services/EnvironmentVariablesManager');
const environment = EnvironmentVariablesManager.getEnvVariable('CRON_ENVIRONMENT') === 'production' ? 'prod' : 'staging'

const FACEBOOK_UPDATE_TODAY_REGULAR_CRON              =  environment === 'prod' ? '*/15 * * * *' : '0 * * * *'
const FACEBOOK_UPDATE_YESTERDAY_BEFORE_MIDNIGHT_CRON  = '5 8 * * *'
const FACEBOOK_UPDATE_YESTERDAY_AFTER_MIDNIGHT_CRON   = '4 11 * * *'
const FACEBOOK_UPDATE_YESTERDAY_AFTER_MIDNIGHT_2_CRON = '5 12 * * *'
const FACEBOOK_UPDATE_EVERY_SIX_HOURS_CRON = '* */6 * * *'

module.exports = {
  FACEBOOK_UPDATE_TODAY_REGULAR_CRON,
  FACEBOOK_UPDATE_YESTERDAY_AFTER_MIDNIGHT_CRON,
  FACEBOOK_UPDATE_YESTERDAY_BEFORE_MIDNIGHT_CRON,
  FACEBOOK_UPDATE_YESTERDAY_AFTER_MIDNIGHT_2_CRON,
  FACEBOOK_UPDATE_EVERY_SIX_HOURS_CRON
};
