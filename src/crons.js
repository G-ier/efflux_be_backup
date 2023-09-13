const initializeCrossroadsCron            = require("./modules/crossroads/crons");
const initializeFacebookCron              = require("./modules/facebook/crons");
const initializeTikTokCron                = require("./modules/tiktok/crons");
const initializeAggregatesUpdateCron      = require("./modules/aggregates/crons/aggregates");
const initializeRevealBotSheetsUpdateCron = require("./modules/aggregates/crons/revealBotSheets");

const initializeCronJobs = () => {

  // Replacements
  initializeCrossroadsCron();
  initializeFacebookCron();
  initializeTikTokCron();
  initializeAggregatesUpdateCron();
  initializeRevealBotSheetsUpdateCron();
};

module.exports = { initializeCronJobs };
