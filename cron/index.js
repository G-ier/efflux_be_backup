const { initializeCRCron } = require("./crossroads-cron");
const { initializeFBCron } = require("./facebook-cron");
const { initializeGoogleCron } = require("./google-cron");
const { initializeGDNCron } = require("./gdn-cron");
const { initializeAMGCron } = require("./amg-cron");
const { initializeSystem1Cron } = require("./system1-cron");
const { initializeSedoCron } = require("./sedo-cron");
const { initializeOBCron } = require("./outbrain-cron");

const initializeCronJobs = () => {
  initializeFBCron();
  initializeCRCron();
  initializeGoogleCron();
  // initializeGDNCron();
  // initializeAMGCron();
  initializeSystem1Cron();
  initializeSedoCron();
  initializeOBCron();
};

module.exports = { initializeCronJobs };
