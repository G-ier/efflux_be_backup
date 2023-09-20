// Third party imports
const CronJob = require("cron").CronJob;

// Local imports
const { todayYMD, yesterdayYMD } = require('../common/day')
const { updateMediaNetStats } = require('../controllers/mediaNetController')
const Rules = require('../constants/cron');

const disableCron = process.env.DISABLE_CRON === "true";

async function updateMediaNetDataJob(day) {

  if (day === 'today') {
    const today = todayYMD()
    await updateMediaNetStats(today)
  }

  if (day === 'yesterday') {
    const yesterday = yesterdayYMD()
    await updateMediaNetStats(yesterday)
  }

}

const mediaNetRegularCron = new CronJob(
  Rules.MEDIA_NET_REGULAR,
  updateMediaNetDataJob.bind(null, "today"),
);

const mediaNetPostEstimationsCron = new CronJob(
  Rules.MEDIA_NET_AFTER_ESTIMATIONS,
  updateMediaNetDataJob.bind(null, "yesterday"),
);

const initializeMediaNetCron = async () => {
  if (!disableCron) {
    mediaNetRegularCron.start();
    mediaNetPostEstimationsCron.start();
  }
}

module.exports = {
  initializeMediaNetCron
}
