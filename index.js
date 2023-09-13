require("dotenv").config();

const { server } = require("./api/server");
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

// 404
server.use(function (req, res, next) {
  return res
    .status(404)
    .send({ message: "[Route] --> " + req.url + " <-- Not found." });
});

// 500 - Any server error
server.use(function (err, req, res, next) {
  return res.status(500).json({ error: err });
});

const port = process.env.PORT || 5000;
// Trigger Build
server.listen(port, () => {
  console.log(`🔥 -------- Server started ---------- 🔥`)

  const disableGeneralCron          = process.env.DISABLE_CRON === 'true' || process.env.DISABLE_CRON !== 'false';
  const disableCrossroadsCron       = process.env.DISABLE_CROSSROADS_CRON === 'true' || process.env.DISABLE_CROSSROADS_CRON !== 'false';
  const disableTikTokCron           = process.env.DISABLE_TIKTOK_CRON === 'true' || process.env.DISABLE_TIKTOK_CRON !== 'false';
  const disableFacebookCron         = process.env.DISABLE_FACEBOOK_CRON === 'true' || process.env.DISABLE_FACEBOOK_CRON !== 'false';
  const disableAggregatesUpdateCron = process.env.DISABLE_AGGREGATES_UPDATE_CRON === 'true' || process.env.DISABLE_AGGREGATES_UPDATE_CRON !== 'false';
  const disableRevealBotSheetCron   = process.env.DISABLE_REVEALBOT_SHEET_CRON === 'true' || process.env.DISABLE_REVEALBOT_SHEET_CRON !== 'false';

  console.log(`
    Port: ${port}
    Cron Jobs:
      General    : ${disableGeneralCron ? 'Disabled' : 'Enabled'}
      Crossroads : ${disableCrossroadsCron ? 'Disabled' : 'Enabled'}
      TikTok     : ${disableTikTokCron ? 'Disabled' : 'Enabled'}
      Facebook   : ${disableFacebookCron ? 'Disabled' : 'Enabled'}
      Aggregates : ${disableAggregatesUpdateCron ? 'Disabled' : 'Enabled'}
      RevealBot  : ${disableRevealBotSheetCron ? 'Disabled' : 'Enabled'}
  `)

});
