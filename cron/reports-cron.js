const { CronJob }                   = require('cron');
const calendar                      = require('../common/day');
const {
  updateMediaBuyersActivity
}                                   = require('../controllers/reportsController');

const disableCron = process.env.DISABLE_CRON === 'true'
const AFTER_MIDNIGHT_PST = '20 9 * * *';

async function updateActivitesReport() {

  const yesterday = calendar.yesterdayYMD()
  // Delete all rows from yesterday if any

  // Update all the rows from yesterday
  await updateMediaBuyersActivity(yesterday, yesterday)
}

const updateActivityReportJob = new CronJob(
  AFTER_MIDNIGHT_PST,
  updateActivitesReport,
);

function initializeReportsCron() {
  if (!disableCron) {
    // We will insert reports here of evvery kind / custom ones
    updateActivityReportJob.start();
  }
}

module.exports = { initializeReportsCron };
