const environment = process.env.ENVIRONMENT === 'production' ? 'prod' : 'staging'

const AGGREGATES_UPDATE_TODAY_REGULAR_CRON = environment === 'prod' ? '* * * * *' : '6 * * * *'
const AGGREGATES_UPDATE_YESTERDAY_AFTER_MIDNIGHT_AND_NOON_CRON = '20 11,17 * * *'

module.exports = {
  AGGREGATES_UPDATE_TODAY_REGULAR_CRON,
  AGGREGATES_UPDATE_YESTERDAY_AFTER_MIDNIGHT_AND_NOON_CRON
}
