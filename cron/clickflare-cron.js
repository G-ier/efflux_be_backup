const { CronJob } = require('cron');
const { todayYMDHM, todayTenMinsAgoYMDHM } = require('../common/day');
const { updateClickflareData } = require('../services/clickflareService');
const Rules = require('../constants/cron');
const { clickflareTimezone } = require('../constants/clickflare');

const disableCron = process.env.DISABLE_CRON === 'true'

const updateClickflare = async () => {
  const startDate = todayTenMinsAgoYMDHM()
  const endDate = todayYMDHM()
  const timezone = clickflareTimezone;
  await updateClickflareData(startDate, endDate, timezone);
}
const clickflareRegularCron = new CronJob(
  Rules.CF_REGULAR,
  (async () => {
    updateClickflare();
  }),
);


const initializeCFCron = () => {
  (async () => {
    updateClickflare()
  })();

  if (!disableCron) {
    clickflareRegularCron.start();
  }
};

module.exports = {
  initializeCFCron,
};
