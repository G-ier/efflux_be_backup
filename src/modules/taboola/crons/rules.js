const EnvironmentVariablesManager = require('../../../shared/services/EnvironmentVariablesManager');
const environment = EnvironmentVariablesManager.getEnvVariable('CRON_ENVIRONMENT') === 'production' ? 'prod' : 'staging'

const TABOOLA_UPDATE_TODAY_REGULAR_CRON              =  environment === 'prod' ? '*/15 * * * *' : '0 * * * *'


module.exports = TABOOLA_UPDATE_TODAY_REGULAR_CRON