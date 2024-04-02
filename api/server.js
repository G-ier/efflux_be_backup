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

  console.log('Initializing Redis...');
  const { initRedis } = require('../src/shared/lib/RedisConnection');
  await initRedis();

  try {
    const { pollSQSQueue } = require('../sqs/index');
    pollSQSQueue();
  } catch (error) {
    console.log('Error initializing SQS Queue');
    console.log(error);
  }

  // Initialize server
  const server = express();
  server.get('/', (req, res) => {
    res.send(
      '<h1 style="color: red; text-align: center; font-size: 40px;">Efflux Server Updated!</h1>',
    );
  });

  const { configureMiddleware } = require('../middleware');
  const { ServerLogger } = require('../src/shared/lib/WinstonLogger');

  // Configuring global middleware
  configureMiddleware(server);

  ServerLogger.info('Server initialized');
  ServerLogger.info('Database Url being used');
  ServerLogger.info(
    'DATABASE_ENVIRONMENT: ' + EnvironmentVariablesManager.getEnvVariable('DATABASE_ENVIRONMENT'),
  );
  ServerLogger.info('DATABASE_URL: ' + EnvironmentVariablesManager.getEnvVariable('DATABASE_URL'));
  ServerLogger.info(
    'DATABASE_URL_BE_RO: ' + EnvironmentVariablesManager.getEnvVariable('DATABASE_URL_BE_RO'),
  );
  ServerLogger.info(
    'DATABASE_URL_BE_RW: ' + EnvironmentVariablesManager.getEnvVariable('DATABASE_URL_BE_RW'),
  );

  // Start server
  const port = EnvironmentVariablesManager.getEnvVariable('PORT') || 5000;

  server.listen(port, async () => {
    console.log(`🔥 ---------- Server started ------------ 🔥`);

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
    const productionReadOnlyDatabaseUrl =
      EnvironmentVariablesManager.getEnvVariable('DATABASE_URL_BE_RO');
    const stagingDatabaseUrl = EnvironmentVariablesManager.getEnvVariable('DATABASE_URL_STAGING');

    const databaseUrl =
      databaseEnvironment === 'production'
        ? productionDatabaseUrl
        : databaseEnvironment === 'staging'
        ? stagingDatabaseUrl
        : process.env.DATABASE_URL_LOCAL;

    const roDatabaseUrl =
      databaseEnvironment === 'production'
        ? productionReadOnlyDatabaseUrl
        : databaseEnvironment === 'staging'
        ? 'N/A'
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

      Database RO:
        Environment: ${databaseEnvironment || 'development'}
        URL: ${roDatabaseUrl}

      Redis:
        Environment: ${redisEnvironment || 'development'}
        URL: ${redisUrl}
    `);
  });
};

module.exports = { initializeAPI };
