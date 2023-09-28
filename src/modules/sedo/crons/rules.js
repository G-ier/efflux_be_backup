const environment = process.env.ENVIRONMENT === 'production' ? 'prod' : 'staging'

const SEDO_UPDATE_YESTERDAY = '0 0,6,10 * * *'
const SEDO_UPDATE_TODAY_REGULAR_CRON = environment === 'prod' ? '*/15 * * * *' : '0 * * * *'

module.exports = {
  SEDO_UPDATE_TODAY_REGULAR_CRON,
  SEDO_UPDATE_YESTERDAY
};
