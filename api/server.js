// Third party imports
require('dotenv').config();
const express = require('express');

// Local imports
const EnvironmentVariablesManager = require('../src/shared/services/EnvironmentVariablesManager');
const { initRedis } = require('../src/shared/lib/RedisConnection');
// Initialize API
const initializeAPI = async () => {
  // Retrieve environment variables
  console.log('Retrieving environment variables...');
  await EnvironmentVariablesManager.init();
  console.log('Environment variables retrieved.');

  console.log('Initializing Redis...');
  await initRedis();

  // Initialize server
  const server = express();
  server.get('/', (req, res) => {
    res.send(
      '<h1 style="color: red; text-align: center; font-size: 40px;">Efflux Server Updated!</h1>',
    );
  });

  const { configureMiddleware } = require('../middleware');
  const { initializeCronJobs } = require('../src/crons');

  // Configuring global middle ware
  configureMiddleware(server);

  // initialize Cron jobs
  initializeCronJobs();

  // Start server
  const port = EnvironmentVariablesManager.getEnvVariable('PORT') || 5000;

  server.listen(port, async () => {
    console.log(`🔥 ---------- Server started ------------ 🔥`);

    const DISABLE_CRON = EnvironmentVariablesManager.getEnvVariable('DISABLE_CRON');
    const DISABLE_CROSSROADS_CRON =
      EnvironmentVariablesManager.getEnvVariable('DISABLE_CROSSROADS_CRON');
    const DISABLE_TONIC_CRON = EnvironmentVariablesManager.getEnvVariable('DISABLE_TONIC_CRON');
    const DISABLE_MEDIANET_CRON =
      EnvironmentVariablesManager.getEnvVariable('DISABLE_MEDIANET_CRON');
    const DISABLE_SEDO_CRON = EnvironmentVariablesManager.getEnvVariable('DISABLE_SEDO_CRON');
    const DISABLE_TIKTOK_CRON = EnvironmentVariablesManager.getEnvVariable('DISABLE_TIKTOK_CRON');
    const DISABLE_FACEBOOK_CRON =
      EnvironmentVariablesManager.getEnvVariable('DISABLE_FACEBOOK_CRON');
    const DISABLE_TABOOLA_CRON = EnvironmentVariablesManager.getEnvVariable('DISABLE_TABOOLA_CRON');
    const DISABLE_AGGREGATES_UPDATE_CRON = EnvironmentVariablesManager.getEnvVariable(
      'DISABLE_AGGREGATES_UPDATE_CRON',
    );
    const DISABLE_REVEALBOT_SHEET_CRON = EnvironmentVariablesManager.getEnvVariable(
      'DISABLE_REVEALBOT_SHEET_CRON',
    );
    const DISABLE_SLACK_NOTIFICATION = EnvironmentVariablesManager.getEnvVariable(
      'DISABLE_SLACK_NOTIFICATION',
    );

    const rulesEnvironment =
      EnvironmentVariablesManager.getEnvVariable('CRON_ENVIRONMENT') || 'staging';
    const disableGeneralCron = DISABLE_CRON === 'true' || DISABLE_CRON !== 'false';
    const disableCrossroadsCron =
      DISABLE_CROSSROADS_CRON === 'true' || DISABLE_CROSSROADS_CRON !== 'false';
    const disableTonicCron = DISABLE_TONIC_CRON === 'true' || DISABLE_TONIC_CRON !== 'false';
    const disableMediaNetCron =
      DISABLE_MEDIANET_CRON === 'true' || DISABLE_MEDIANET_CRON !== 'false';
    const disableSedoCron = DISABLE_SEDO_CRON === 'true' || DISABLE_SEDO_CRON !== 'false';
    const disableTikTokCron = DISABLE_TIKTOK_CRON === 'true' || DISABLE_TIKTOK_CRON !== 'false';
    const disableFacebookCron =
      DISABLE_FACEBOOK_CRON === 'true' || DISABLE_FACEBOOK_CRON !== 'false';
    const disableTaboolaCron = DISABLE_TABOOLA_CRON === 'true' || DISABLE_TABOOLA_CRON !== 'false';
    const disableAggregatesUpdateCron =
      DISABLE_AGGREGATES_UPDATE_CRON === 'true' || DISABLE_AGGREGATES_UPDATE_CRON !== 'false';
    const disableRevealBotSheetCron =
      DISABLE_REVEALBOT_SHEET_CRON === 'true' || DISABLE_REVEALBOT_SHEET_CRON !== 'false';
    const disableSlackNotification =
      DISABLE_SLACK_NOTIFICATION === 'true' || DISABLE_SLACK_NOTIFICATION !== 'false';

    const loggingEnvironment =
      EnvironmentVariablesManager.getEnvVariable('LOGGING_ENVIRONMENT') || 'development';
    const logLevel = EnvironmentVariablesManager.getEnvVariable('LOG_LEVEL') || 'info';

    const databaseEnvironment =
      EnvironmentVariablesManager.getEnvVariable('DATABASE_ENVIRONMENT') || 'development';
    const productionDatabaseUrl = EnvironmentVariablesManager.getEnvVariable('DATABASE_URL');
    const stagingDatabaseUrl = EnvironmentVariablesManager.getEnvVariable('DATABASE_URL_STAGING');

    const databaseUrl =
      databaseEnvironment === 'production'
        ? productionDatabaseUrl
        : databaseEnvironment === 'staging'
        ? stagingDatabaseUrl
        : process.env.DATABASE_URL_LOCAL;

    const redisEnvironment = EnvironmentVariablesManager.getEnvVariable('REDIS_ENVIRONMENT');
    const redisUrl =
      redisEnvironment === 'production'
        ? EnvironmentVariablesManager.getEnvVariable('REDIS_CLUSTER_URL_PRODUCTION')
        : redisEnvironment === 'staging'
        ? EnvironmentVariablesManager.getEnvVariable('REDIS_CLUSTER_URL_STAGING')
        : process.env.REDIS_CLUSTER_URL_LOCAL;

    console.log(`
      Server Info:
        Port: ${port}
        Slack Notifications: ${disableSlackNotification ? 'Disabled' : 'Enabled'}
        Environment Location: ${
          process.env.ENVIRONMENT_LOCATION === 'local' ? 'Local' : 'AWS Cloud'
        }

      Logging:
        "The production environment logs every modules logs to it's
        own file. The development environment logs all modules logs
        to the console. Even if you don't set the LOGGING_ENVIRONMENT
        variable, the default is development."

        Environment: ${loggingEnvironment || 'development'}
        Log Level: ${logLevel || 'info'}

      Database:
        Environment: ${databaseEnvironment || 'development'}
        URL: ${databaseUrl}

      Redis:
        Environment: ${redisEnvironment || 'development'}
        URL: ${redisUrl}

      Cron Jobs [${rulesEnvironment}]:
        Enable All : ${disableGeneralCron ? 'Disabled' : 'Enabled'}
        Crossroads : ${disableCrossroadsCron ? 'Disabled' : 'Enabled'}
        Tonic      : ${disableTonicCron ? 'Disabled' : 'Enabled'}
        MediaNet   : ${disableMediaNetCron ? 'Disabled' : 'Enabled'}
        Sedo       : ${disableSedoCron ? 'Disabled' : 'Enabled'}
        TikTok     : ${disableTikTokCron ? 'Disabled' : 'Enabled'}
        Facebook   : ${disableFacebookCron ? 'Disabled' : 'Enabled'}
        Taboola    : ${disableTaboolaCron ? 'Disabled' : 'Enabled'}
        Aggregates : ${disableAggregatesUpdateCron ? 'Disabled' : 'Enabled'}
        RevealBot  : ${disableRevealBotSheetCron ? 'Disabled' : 'Enabled'}
    `);
  });
};

module.exports = { initializeAPI };
