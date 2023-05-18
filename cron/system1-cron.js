const {CronJob} = require('cron');
const Rules = require('../constants/cron');
const {
  updateSystem1Hourly,
  updateSystem1Daily
} = require('../services/system1Service');
const {updateS1_Spreadsheet} = require('../controllers/spreadsheetController');
const { updateTablePartitions } = require("./helpers");

const disableCron = process.env.DISABLE_CRON === 'true';

const updateSystem1DataHourlyJob = new CronJob(
  Rules.SYSTEM1_HOURLY,
  updateSystem1Hourly,
);

const updateSystem1DataDailyJob = new CronJob(
  Rules.SYSTEM1_DAILY,
  updateSystem1Daily,
);

const updateSystem1SheetJob = new CronJob(
  Rules.SYSTEM1_EVERY_5_MINUTES,
  updateS1_Spreadsheet,
);

const system1PartitionsJob = new CronJob(
  Rules.PARTITIONS_DAILY,
  updateSystem1Partitions
)

async function updateSystem1Partitions() {
  await updateTablePartitions('system1_partitioned')
  await updateTablePartitions('s1_conversions_partitioned')
}


function initializeSystem1Cron() {
  if (!disableCron) {
    system1PartitionsJob.start();
    updateSystem1DataHourlyJob.start();
    // updateSystem1DataDailyJob.start();
    updateSystem1SheetJob.start();
  }
}

module.exports = {initializeSystem1Cron};
