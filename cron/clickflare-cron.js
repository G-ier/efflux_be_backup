const { CronJob } = require('cron');
const { todayYMDHM, todayTenMinsAgoYMDHM, dayYMDHM, someDaysAgoYMD, someTimeAgoYMDHM } = require('../common/day');
const { updateClickflareData } = require('../services/clickflareService');
const Rules = require('../constants/cron');
const { clickflareTimezone, sheetsArr } = require('../constants/clickflare');
const { updateCF_DaySpreadsheet } = require('../controllers/spreadsheetController');

const disableCron = process.env.DISABLE_CRON === 'true'

const updateClickflare = async () => {
  const startDate = todayTenMinsAgoYMDHM()
  const endDate = todayYMDHM()
  console.log('startDate',startDate)

  const timezone = clickflareTimezone;
  await updateClickflareData(startDate, endDate, timezone);

  sheetsArr.forEach(async (sheet) => {
    await updateCF_DaySpreadsheet(sheet)
  })
}

const clickflareRegularCron = new CronJob(
  Rules.CF_REGULAR,
  (async () => {
    console.log('start clickflare data downloading')
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
