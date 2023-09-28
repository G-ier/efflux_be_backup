// Third party imports
const { CronJob } = require("cron");

// Local application imports
const { todayYMD, yesterdayYMD, dayBeforeYesterdayYMD } = require("../../../../shared/helpers/calendar");
const { sendSlackNotification } = require("../../../../shared/lib/SlackNotificationService");
const AggregatesService = require("../../services/AggregatesService");
const { AVAILABLE_NETWORKS, AVAILABLE_TRAFFIC_SOURCES } = require("../../constants");
const {
  AGGREGATES_UPDATE_TODAY_REGULAR_CRON,
  AGGREGATES_UPDATE_YESTERDAY_AFTER_MIDNIGHT_AND_NOON_CRON,
} = require("./rules");
const { dataUpdatesLogger } = require("../../../../shared/lib/WinstonLogger");

const disableGeneralCron = process.env.DISABLE_CRON === "true" || process.env.DISABLE_CRON !== "false";
const disableAggregatesUpdateCron =
  process.env.DISABLE_AGGREGATES_UPDATE_CRON === "true" || process.env.DISABLE_AGGREGATES_UPDATE_CRON !== "false";
const aggregatesService = new AggregatesService();

async function updateCompiledAggregates(day = "today", network, trafficSource) {
  dataUpdatesLogger.info(`STARTED | AGGREGATES | ${day} | ${network} | ${trafficSource}`);
  try {
    let startDate, endDate;
    if (day === "today") {
      startDate = yesterdayYMD();
      endDate = todayYMD();
    } else if (day === "yesterday") {
      startDate = dayBeforeYesterdayYMD();
      endDate = yesterdayYMD();
    }
    await aggregatesService.updateAggregates(network, trafficSource, startDate, endDate);
    dataUpdatesLogger.info(`COMPLETED | AGGREGATES | ${day} | ${network} | ${trafficSource}`);
  } catch (e) {
    dataUpdatesLogger.warn(`FAILED | AGGREGATES | ${day} | ${network} | ${trafficSource} | ${e}`);
    await sendSlackNotification(`FAILED | AGGREGATES | ${day} | ${network} | ${trafficSource}`);
    console.log(e);
  }
}

const updateTodayDataRegular = new CronJob(AGGREGATES_UPDATE_TODAY_REGULAR_CRON, async () => {
  for (const network of AVAILABLE_NETWORKS) {
    for (const trafficSource of AVAILABLE_TRAFFIC_SOURCES) {
      await updateCompiledAggregates("today", network, trafficSource);
    }
  }
});

const updateYesterdayDataAfterMidnightAndNoon = new CronJob(
  AGGREGATES_UPDATE_YESTERDAY_AFTER_MIDNIGHT_AND_NOON_CRON,
  async () => {
    for (const network of AVAILABLE_NETWORKS) {
      for (const trafficSource of AVAILABLE_TRAFFIC_SOURCES) {
        await updateCompiledAggregates("yesterday", network, trafficSource);
      }
    }
  },
);

const initializeAggregatesUpdateCron = async () => {
  // If both are disabled, return immediately
  if (disableGeneralCron && disableAggregatesUpdateCron) return;

  updateTodayDataRegular.start();
  updateYesterdayDataAfterMidnightAndNoon.start();
};

module.exports = initializeAggregatesUpdateCron;
