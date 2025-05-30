const {CronJob} = require('cron');
const Rules = require('../constants/cron');
const { updateTablePartitions } = require('./helpers');

const disableCron = process.env.DISABLE_CRON === "true";

// For efficiency the table is a partitioned table.
// The partitions are created in advance.
// This cron job updates the partitions.
// It always keeps the last 60 days of data.

const updateTablePartitionsJob = new CronJob(
  Rules.PARTITIONS_DAILY,
  updatePostbackPartitions,
);

async function updatePostbackPartitions() {
  await updateTablePartitions('postback_events_partitioned')
}

function initializePostbackPartitionsCron() {
  if (!disableCron) {
    updateTablePartitionsJob.start();
  }
}

module.exports = {initializePostbackPartitionsCron};
