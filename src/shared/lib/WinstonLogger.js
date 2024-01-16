// Third party imports
const AWS = require('aws-sdk');

AWS.config.update({
  region: 'us-east-1',
});

const { createLogger, format, transports } = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');
const path = require('path');

// Local application imports
const EnvironmentVariablesManager = require('../services/EnvironmentVariablesManager');

class CustomLogger {
  constructor(options) {
    const { destination, level, pattern, logGroupName } = options;

    let logTransports = [];

    if (destination === 'cloudwatch') {
      const today = new Date().toISOString().split('T')[0]; // Format: 'YYYY-MM-DD'
      const logStreamName = `${today}-${options.logStreamName}`; // Append the date to the log stream name  (e.g. '2020-01-01-logs')
      logTransports.push(
        new WinstonCloudWatch({
          logGroupName: logGroupName,
          logStreamName: logStreamName,
          awsOptions: {
            credentials: {
              accessKeyId: EnvironmentVariablesManager.getEnvVariable(
                'EFFLUX_LOGGER_ACCESS_KEY_ID',
              ),
              secretAccessKey: EnvironmentVariablesManager.getEnvVariable(
                'EFFLUX_LOGGER_SECRET_KEY',
              ),
            },
            region: 'us-east-1',
          },
          jsonMessage: true,
          createLogGroup: true,
          createLogStream: true,
        }),
      );
    } else {
      logTransports = new transports.Console({
        timestamp: true,
        colorize: true,
      });
    }

    this.logger = createLogger({
      level: level || 'info',
      format:
        destination === 'cloudwatch'
          ? format.json()
          : format.combine(
              format.timestamp(),
              format.printf((info) => {
                let formattedPattern =
                  pattern || '[{timestamp}][{filename}][{method}]:[{level}] - {message}';
                return formattedPattern
                  .replace('{timestamp}', (info.timestamp || '').padEnd(25, ' ')) // Assuming 25 characters for timestamp
                  .replace('{filename}', (info.filename || '').padEnd(30, ' ')) // 30 characters for filename
                  .replace('{method}', (info.method || '').padEnd(40, ' ')) // Assuming 20 characters for method
                  .replace('{level}', info.level) // Assuming 10 characters for level
                  .replace('{message}', info.message || '');
              }),
            ),

      transports: logTransports,
    });
  }

  log(level, message) {
    this.logger.log(level, message, ...this.getCallerInfo());
  }

  info(message) {
    this.logger.info(message, ...this.getCallerInfo());
  }

  warn(message) {
    this.logger.warn(message, ...this.getCallerInfo());
  }

  error(message) {
    this.logger.error(message, ...this.getCallerInfo());
  }

  debug(message) {
    this.logger.debug(message, ...this.getCallerInfo());
  }

  getCallerInfo() {
    const stackList = new Error().stack.split('\n').slice(3);
    const stackRegexp = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi;
    const stackRegexp2 = /at\s+()(.*):(\d*):(\d*)/gi;

    const s = stackList[0] || stackList[1];
    const sp = stackRegexp.exec(s) || stackRegexp2.exec(s);

    if (!sp) {
      return [];
    }

    let methodName = sp[1];
    const fileName = path.basename(sp[2]);

    if (methodName === 'Object.<anonymous>') {
      methodName = 'global';
    }

    return [
      {
        filename: fileName,
        method: methodName,
      },
    ];
  }
}

const streamDestination =
  EnvironmentVariablesManager.getEnvVariable('LOGGING_ENVIRONMENT') === 'production'
    ? 'cloudwatch'
    : 'console';

// Crossroads Logger
const CrossroadsLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + EnvironmentVariablesManager.getEnvVariable('ENVIRONMENT'),
  logStreamName: 'crossroads',
});

// Facebook Logger
const FacebookLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + EnvironmentVariablesManager.getEnvVariable('ENVIRONMENT'),
  logStreamName: 'facebook',
});

// Tiktok Logger
const TiktokLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + EnvironmentVariablesManager.getEnvVariable('ENVIRONMENT'),
  logStreamName: 'tiktok',
});

// Taboola Logger
const TaboolaLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + EnvironmentVariablesManager.getEnvVariable('ENVIRONMENT'),
  logStreamName: 'taboola',
});
// Capi Logger
const CapiLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + EnvironmentVariablesManager.getEnvVariable('ENVIRONMENT'),
  logStreamName: 'capi',
});
// Aggregates Logger
const AggregatesLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + EnvironmentVariablesManager.getEnvVariable('ENVIRONMENT'),
  logStreamName: 'aggregates',
});

// FunnelFlux Logger
const FunnelFluxLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + EnvironmentVariablesManager.getEnvVariable('ENVIRONMENT'),
  logStreamName: 'funnelFlux',
});

// Postback Logger
const PostbackLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + EnvironmentVariablesManager.getEnvVariable('ENVIRONMENT'),
  logStreamName: 'postback',
  pattern: '[{timestamp}]:[{level}] - {message}',
});

const PostbackTestLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + EnvironmentVariablesManager.getEnvVariable('ENVIRONMENT'),
  logStreamName: 'postback_test',
  pattern: '[{timestamp}]:[{level}] - {message}',
});
// Requests Logger
const RequestsLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + EnvironmentVariablesManager.getEnvVariable('ENVIRONMENT'),
  logStreamName: 'requests',
  pattern: '[{timestamp}]:[{level}]:{message}',
});

// Sedo Logger
const SedoLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + EnvironmentVariablesManager.getEnvVariable('ENVIRONMENT'),
  logStreamName: 'sedo',
});

// Tonic Logger
const TonicLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + EnvironmentVariablesManager.getEnvVariable('ENVIRONMENT'),
  logStreamName: 'tonic',
});

// MediaNet Logger
const MediaNetLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + EnvironmentVariablesManager.getEnvVariable('ENVIRONMENT'),
  logStreamName: 'medianet',
});

// Analysis Logger
const AnalysisLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + EnvironmentVariablesManager.getEnvVariable('ENVIRONMENT'),
  logStreamName: 'analysis',
});

// CRON data update Logger
const dataUpdatesLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + EnvironmentVariablesManager.getEnvVariable('ENVIRONMENT'),
  logStreamName: 'updates',
});

// User Logger
const UserLogger = new CustomLogger({
  destination: streamDestination,
  level: 'debug',
  logGroupName: '/aws/ec2/efflux-be-' + EnvironmentVariablesManager.getEnvVariable('ENVIRONMENT'),
  logStreamName: 'user',
});

// Organization Logger
const OrganizationLogger = new CustomLogger({
  destination: streamDestination,
  level: 'debug',
  logGroupName: '/aws/ec2/efflux-be-' + EnvironmentVariablesManager.getEnvVariable('ENVIRONMENT'),
  logStreamName: 'organization',
});

// Insights Logger
const InsightsLogger = new CustomLogger({
  destination: streamDestination,
  level: 'debug',
  logGroupName: '/aws/ec2/efflux-be-' + EnvironmentVariablesManager.getEnvVariable('ENVIRONMENT'),
  logStreamName: 'insights',
});

// Adset Logger
const AdsetLogger = new CustomLogger({
  destination: streamDestination,
  level: 'debug',
  logGroupName: '/aws/ec2/efflux-be-' + EnvironmentVariablesManager.getEnvVariable('ENVIRONMENT'),
  logStreamName: 'adset',
});

// Ads Logger
const AdsLogger = new CustomLogger({
  destination: streamDestination,
  level: 'debug',
  logGroupName: '/aws/ec2/efflux-be-' + EnvironmentVariablesManager.getEnvVariable('ENVIRONMENT'),
  logStreamName: 'ads',
});

// Campaigns Logger
const CampaignsLogger = new CustomLogger({
  destination: streamDestination,
  level: 'debug',
  logGroupName: '/aws/ec2/efflux-be-' + EnvironmentVariablesManager.getEnvVariable('ENVIRONMENT'),
  logStreamName: 'campaigns',
});

// Pixels Logger
const PixelsLogger = new CustomLogger({
  destination: streamDestination,
  level: 'debug',
  logGroupName: '/aws/ec2/efflux-be-' + EnvironmentVariablesManager.getEnvVariable('ENVIRONMENT'),
  logStreamName: 'pixels',
});

// UserAccount Logger
const UserAccountLogger = new CustomLogger({
  destination: streamDestination,
  level: 'debug',
  logGroupName: '/aws/ec2/efflux-be-' + EnvironmentVariablesManager.getEnvVariable('ENVIRONMENT'),
  logStreamName: 'userAccount',
});

module.exports = {
  CrossroadsLogger,
  FacebookLogger,
  TiktokLogger,
  TaboolaLogger,
  CapiLogger,
  AggregatesLogger,
  FunnelFluxLogger,
  PostbackLogger,
  PostbackTestLogger,
  RequestsLogger,
  AnalysisLogger,
  dataUpdatesLogger,
  SedoLogger,
  TonicLogger,
  MediaNetLogger,
};
