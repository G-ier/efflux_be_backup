const { todayYMDHM, tomorrowYMD, someDaysAgoYMD, dayAfterTomorrowYMD } = require('../common/day')
const db = require('../data/dbConfig');
const { sendSlackNotification } = require("../services/slackNotificationService");

// For efficiency the table is a partitioned table.
// The partitions are created in advance.
// This cron job updates the partitions.
// It always keeps the last 60 days of data.
async function updateTablePartitions(tablename) {

  try {
    console.log(`Updating ${tablename} table partitions;`);
    const tomorrow = tomorrowYMD()
    const someDaysAgo = someDaysAgoYMD(60)
    const dayAfterTomorrow = dayAfterTomorrowYMD()

    if (false) {
      console.log('Today', todayYMDHM().replace(/-/g, '_'));
      console.log('Tomorrow', tomorrowYMD().replace(/-/g, '_'));
      console.log('Day After Tomorrow', dayAfterTomorrowYMD().replace(/-/g, '_'));
      console.log('Some days ago', someDaysAgoYMD(60).replace(/-/g, '_'));
    }

    // Create a new partition for tomorrow
    let insertQuery = `
      CREATE TABLE IF NOT EXISTS ${tablename}_${tomorrow.replace(/-/g, '_')}
      PARTITION OF ${tablename}
      FOR VALUES FROM ('${tomorrow}') TO ('${dayAfterTomorrow}');
    `;

    await db.raw(insertQuery);
    console.log(`Created new partition for ${tomorrow}`);

    // Drop the partition from 60 days ago
    deleteQuery = `
      DROP TABLE IF EXISTS ${tablename}_${someDaysAgo.replace(/-/g, '_')};
    `;
    await db.raw(deleteQuery);
    console.log(`Deleted old partition for ${someDaysAgo}`);
    console.log(`Finished updating ${tablename} table partitions;`);

  } catch(err) {
    console.log("Error updating post back table partitions;", err);
    await sendSlackNotification(`Error updating table partitions\nError: \n${err.toString()}`);
  }

}
module.exports = {updateTablePartitions};
