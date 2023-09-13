const { CronJob }                   = require('cron');
const calendar                      = require('../common/day');
const db                            = require('../data/dbConfig');
const {
  updateMediaBuyersActivity
}                                   = require('../controllers/reportsController');

const disableCron = process.env.DISABLE_CRON === 'true'
const AFTER_MIDNIGHT_PST = '20 9 * * *';
const REGULAR = '20 * * * *';

async function updateActivitesReport() {

  const yesterday = calendar.yesterdayYMD()

  // Delete all rows from today if any
  await db("activity_report").where("date", yesterday).del();

  // Update all the rows from yesterday
  await updateMediaBuyersActivity(yesterday, yesterday)
}

async function updateActivitesReport() {

  const today = calendar.todayYMD()

  // Delete all rows from today if any
  const removed = await db("activity_report").where("date", today).del();
  console.log(`Removed ${removed} rows from activity_report`)

  // Update all the rows from yesterday
  await updateMediaBuyersActivity(today, today)
}

const activityReports = () => {

  const updateActivityReportJobDaily = new CronJob(
    AFTER_MIDNIGHT_PST,
    updateActivitesReport,
  );

  const updateActivityReportRegular = new CronJob(
    REGULAR,
    updateActivitesReport,
  );

  updateActivityReportJobDaily.start();
  updateActivityReportRegular.start();
}


function initializeReportsCron() {
  if (!disableCron) {
    // We will insert reports here of evvery kind / custom ones
    activityReports()
  }
}

module.exports = { initializeReportsCron };
