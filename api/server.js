// Third party imports
require('dotenv').config();
const express = require('express');

// Local imports
const EnvironmentVariablesManager = require('../src/shared/services/EnvironmentVariablesManager');

// Initialize API
const initializeAPI = async () => {
  // Retrieve environment variables
  console.log('Retrieving environment variables...');
  await EnvironmentVariablesManager.init();
  console.log('Environment variables retrieved.');

  // Initialize server
  const server = express();
  server.get('/', (req, res) => {
    res.send(
      '<h1 style="color: red; text-align: center; font-size: 40px;">Efflux Server Updated!</h1>',
    );
  });

  const { configureMiddleware } = require('../middleware');

  // Configuring global middle ware
  configureMiddleware(server);

  // Start server
  const port = EnvironmentVariablesManager.getEnvVariable('PORT') || 5000;

  server.listen(port, async () => {
    console.log(`🔥 ---------- Server started ------------ 🔥`);

    const DISABLE_SLACK_NOTIFICATION = EnvironmentVariablesManager.getEnvVariable(
      'DISABLE_SLACK_NOTIFICATION',
    );

    const disableSlackNotification = DISABLE_SLACK_NOTIFICATION === 'true' ? true : false;

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
    `);
  });
};

module.exports = { initializeAPI };
