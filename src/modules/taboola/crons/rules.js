const EnvironmentVariablesManager = require('../../../shared/services/EnvironmentVariablesManager');
const environment = EnvironmentVariablesManager.getEnvVariable('CRON_ENVIRONMENT') === 'production' ? 'prod' : 'staging'

const TABOOLA_UPDATE_TODAY_REGULAR_CRON              =  environment === 'prod' ? '*/15 * * * *' : '0 * * * *'
const TABOOLA_UPDATE_YESTERDAY_CRON                  = '5 8,12 * * *'
const TABOOLA_CAPI_REPORT_REGULAR_CRON               =  '4,19,34,49 * * * *'
const TABOOLA_REPORT_CONVERSIONS_YESTERDAY           = '4 11,17 * * *'

module.exports = { TABOOLA_UPDATE_TODAY_REGULAR_CRON, TABOOLA_UPDATE_YESTERDAY_CRON, TABOOLA_REPORT_CONVERSIONS_YESTERDAY, TABOOLA_CAPI_REPORT_REGULAR_CRON }