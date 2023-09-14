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

server.listen(port, () => {
  console.log(`🔥 -------- Server started ---------- 🔥`)

  const disableGeneralCron          = process.env.DISABLE_CRON === 'true' || process.env.DISABLE_CRON !== 'false';
  const disableCrossroadsCron       = process.env.DISABLE_CROSSROADS_CRON === 'true' || process.env.DISABLE_CROSSROADS_CRON !== 'false';
  const disableTikTokCron           = process.env.DISABLE_TIKTOK_CRON === 'true' || process.env.DISABLE_TIKTOK_CRON !== 'false';
  const disableFacebookCron         = process.env.DISABLE_FACEBOOK_CRON === 'true' || process.env.DISABLE_FACEBOOK_CRON !== 'false';
  const disableAggregatesUpdateCron = process.env.DISABLE_AGGREGATES_UPDATE_CRON === 'true' || process.env.DISABLE_AGGREGATES_UPDATE_CRON !== 'false';
  const disableRevealBotSheetCron   = process.env.DISABLE_REVEALBOT_SHEET_CRON === 'true' || process.env.DISABLE_REVEALBOT_SHEET_CRON !== 'false';
  const disableSlackNotification    = process.env.DISABLE_SLACK_NOTIFICATION === 'true' || process.env.DISABLE_SLACK_NOTIFICATION !== 'false';
  const rulesEnvironment            = process.env.ENVIRONMENT || 'staging';
  const loggingEnvironment          = process.env.LOGGING_ENVIRONMENT || 'development';
  const logLevel                    = process.env.LOG_LEVEL || 'info';

  const databaseEnvironment         = process.env.DATABASE_ENVIRONMENT || 'development';
  const databaseUrl                 = databaseEnvironment === 'production' ? process.env.DATABASE_URL : process.env.DATABASE_URL_STAGING;

  console.log(`
    Server Info:
      Port: ${port}
      Slack Notifications: ${disableSlackNotification ? 'Disabled' : 'Enabled'}

    Logging:
      Environment: ${loggingEnvironment|| 'development'}
      Log Level: ${logLevel || 'info'}

    Database:
      Environment: ${databaseEnvironment || 'development'}
      URL: ${databaseUrl || 'development'}

    Cron Jobs [${rulesEnvironment}]:
      Enable All : ${disableGeneralCron ? 'Disabled' : 'Enabled'}
      Crossroads : ${disableCrossroadsCron ? 'Disabled' : 'Enabled'}
      TikTok     : ${disableTikTokCron ? 'Disabled' : 'Enabled'}
      Facebook   : ${disableFacebookCron ? 'Disabled' : 'Enabled'}
      Aggregates : ${disableAggregatesUpdateCron ? 'Disabled' : 'Enabled'}
      RevealBot  : ${disableRevealBotSheetCron ? 'Disabled' : 'Enabled'}
  `)

});
