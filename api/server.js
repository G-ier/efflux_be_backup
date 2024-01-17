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

  // Configuring global middleware
  configureMiddleware(server);

  // Start server
  const port = EnvironmentVariablesManager.getEnvVariable('PORT') || 5000;

  server.listen(port, async () => {
    console.log(`🔥 ---------- Server started ------------ 🔥`);

    const DISABLE_CRON = 'true';

    const DISABLE_SLACK_NOTIFICATION = EnvironmentVariablesManager.getEnvVariable(
      'DISABLE_SLACK_NOTIFICATION',
    );

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
        Environment: ${loggingEnvironment || 'development'}
        Log Level: ${logLevel || 'info'}

      Database:
        Environment: ${databaseEnvironment || 'development'}
        URL: ${databaseUrl}

      Redis:
        Environment: ${redisEnvironment || 'development'}
        URL: ${redisUrl}
    `);
  });
};

module.exports = { initializeAPI };
