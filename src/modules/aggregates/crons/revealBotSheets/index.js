// Third party imports
const { CronJob }                                                = require('cron');

// Local application imports
const RevealBotSheetService                                      = require('../../services/RevealBotSheetService');
const {
  FACEBOOK_REVEALBOT_SHEET_REGULAR_CRON,
  TIKTOK_REVEALBOT_SHEET_REGULAR_CRON
}                                                                = require('./rules');
const { dataUpdatesLogger }                                      = require("../../../../shared/lib/WinstonLogger");
const { sendSlackNotification }                                  = require("../../../../shared/lib/SlackNotificationService");

const disableGeneralCron          = process.env.DISABLE_CRON === 'true' || process.env.DISABLE_CRON !== 'false';
const disableRevealBotSheetCron   = process.env.DISABLE_REVEALBOT_SHEET_CRON === 'true' || process.env.DISABLE_REVEALBOT_SHEET_CRON !== 'false';
const revealBotSheetService       = new RevealBotSheetService();

const updateFacebookRevealBotSheetRegular = new CronJob(
  FACEBOOK_REVEALBOT_SHEET_REGULAR_CRON,
  (async () => {
    dataUpdatesLogger.info(`STARTED | REVEALBOT SHEET | FACEBOOK`);
    try{
      await revealBotSheetService.updateFacebookRevealBotSheet();
      dataUpdatesLogger.info(`COMPLETED | REVEALBOT SHEET | FACEBOOK`);
    } catch (e) {
      dataUpdatesLogger.warn(`FAILED | REVEALBOT SHEET | FACEBOOK | ${e}`);
      await sendSlackNotification(`FAILED | REVEALBOT SHEET | FACEBOOK`);
      console.log(e);
    }
  }
));

const updateTikTokRevealBotSheetRegular = new CronJob(
  TIKTOK_REVEALBOT_SHEET_REGULAR_CRON,
  (async () => {
    dataUpdatesLogger.info(`STARTED | REVEALBOT SHEET | TIKTOK`);
    try {
      await revealBotSheetService.updateTiktokRevealBotSheet();
      dataUpdatesLogger.info(`COMPLETED | REVEALBOT SHEET | TIKTOK`);
    } catch (e) {
      dataUpdatesLogger.warn(`FAILED | REVEALBOT SHEET | TIKTOK | ${e}`);
      await sendSlackNotification(`FAILED | REVEALBOT SHEET | TIKTOK`);
      console.log(e);
    }
  }
));

const initializeRevealBotSheetsUpdateCron = () => {
  if (disableGeneralCron && disableRevealBotSheetCron) return;

  updateFacebookRevealBotSheetRegular.start();
  updateTikTokRevealBotSheetRegular.start();
}

module.exports = initializeRevealBotSheetsUpdateCron
