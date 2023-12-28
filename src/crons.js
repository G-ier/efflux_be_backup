const initializeCrossroadsCron            = require("./modules/crossroads/crons");
const initializeFacebookCron              = require("./modules/facebook/crons");
const initializeTikTokCron                = require("./modules/tiktok/crons");
const initializeTaboolaCron               = require("./modules/taboola/crons");
const initializeSedoCron                  = require("./modules/sedo/crons");
const initializeAggregatesUpdateCron      = require("./modules/aggregates/crons/aggregates");
const initializeRevealBotSheetsUpdateCron = require("./modules/aggregates/crons/revealBotSheets");
const initializeTonicCron                 = require("./modules/tonic/crons");
const initializeTemporaryCron             = require("./modules/temp/crons");


const initializeCronJobs = () => {
  initializeCrossroadsCron();
  initializeSedoCron();
  initializeFacebookCron();
  initializeTikTokCron();
  initializeTaboolaCron();
  initializeAggregatesUpdateCron();
  initializeRevealBotSheetsUpdateCron();
  initializeTonicCron();
  // initializeTemporaryCron();
};

module.exports = { initializeCronJobs };
