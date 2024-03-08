// Third party imports
const { createLogger, format, transports } = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');
const path = require('path');

// Local application imports
const EnvironmentVariablesManager = require('../services/EnvironmentVariablesManager');

class CustomLogger {
  constructor(options) {
    const { destination, level, logGroupName } = options;

    let logTransports = [];

    if (destination === 'cloudwatch') {
      const today = new Date().toISOString().split('T')[0]; // Format: 'YYYY-MM-DD'
      const logStreamName = `${today}-${options.logStreamName}`; // Append the date to the log stream name  (e.g. '2020-01-01-logs')
      logTransports.push(
        new WinstonCloudWatch({
          awsRegion: 'us-east-1',
          logGroupName: logGroupName,
          logStreamName: logStreamName,
          jsonMessage: false,
          createLogGroup: true,
          createLogStream: true,
        }),
      );
    } else {
      logTransports = new transports.Console({
        format: format.combine(
          format.timestamp(),
          format.colorize(),
          format.printf(({ level, message, timestamp }) => `${timestamp} - ${level}: ${message}`),
        ),
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
                let formattedPattern = '[{timestamp}][{filename}][{method}]:[{level}] - {message}';
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

const loggingEnv = EnvironmentVariablesManager.getEnvVariable('LOGGING_ENVIRONMENT');

// Crossroads Logger
const CrossroadsLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + loggingEnv,
  logStreamName: 'crossroads',
});

// Facebook Logger
const FacebookLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + loggingEnv,
  logStreamName: 'facebook',
});

// Tiktok Logger
const TiktokLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + loggingEnv,
  logStreamName: 'tiktok',
});

// Taboola Logger
const TaboolaLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + loggingEnv,
  logStreamName: 'taboola',
});
// Capi Logger
const CapiLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + loggingEnv,
  logStreamName: 'capi',
});
// Aggregates Logger
const AggregatesLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + loggingEnv,
  logStreamName: 'aggregates',
});

// FunnelFlux Logger
const FunnelFluxLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + loggingEnv,
  logStreamName: 'funnelFlux',
});

// Postback Logger
const PostbackLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + loggingEnv,
  logStreamName: 'postback',
});

const PostbackTestLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + loggingEnv,
  logStreamName: 'postback_test',
});
// Requests Logger
const RequestsLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + loggingEnv,
  logStreamName: 'requests',
});

// Sedo Logger
const SedoLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + loggingEnv,
  logStreamName: 'sedo',
});

// Tonic Logger
const TonicLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + loggingEnv,
  logStreamName: 'tonic',
});

// MediaNet Logger
const MediaNetLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + loggingEnv,
  logStreamName: 'medianet',
});

// Analysis Logger
const AnalysisLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + loggingEnv,
  logStreamName: 'analysis',
});

// User Logger
const UserLogger = new CustomLogger({
  destination: streamDestination,
  level: 'debug',
  logGroupName: '/aws/ec2/efflux-be-' + loggingEnv,
  logStreamName: 'user',
});

// Organization Logger
const OrganizationLogger = new CustomLogger({
  destination: streamDestination,
  level: 'debug',
  logGroupName: '/aws/ec2/efflux-be-' + loggingEnv,
  logStreamName: 'organization',
});

// Insights Logger
const InsightsLogger = new CustomLogger({
  destination: streamDestination,
  level: 'debug',
  logGroupName: '/aws/ec2/efflux-be-' + loggingEnv,
  logStreamName: 'insights',
});

// Adset Logger
const AdsetLogger = new CustomLogger({
  destination: streamDestination,
  level: 'debug',
  logGroupName: '/aws/ec2/efflux-be-' + loggingEnv,
  logStreamName: 'adset',
});

// Ads Logger
const AdsLogger = new CustomLogger({
  destination: streamDestination,
  level: 'debug',
  logGroupName: '/aws/ec2/efflux-be-' + loggingEnv,
  logStreamName: 'ads',
});

// Campaigns Logger
const CampaignsLogger = new CustomLogger({
  destination: streamDestination,
  level: 'debug',
  logGroupName: '/aws/ec2/efflux-be-' + loggingEnv,
  logStreamName: 'campaigns',
});

// Pixels Logger
const PixelsLogger = new CustomLogger({
  destination: streamDestination,
  level: 'debug',
  logGroupName: '/aws/ec2/efflux-be-' + loggingEnv,
  logStreamName: 'pixels',
});

// UserAccount Logger
const UserAccountLogger = new CustomLogger({
  destination: streamDestination,
  level: 'debug',
  logGroupName: '/aws/ec2/efflux-be-' + loggingEnv,
  logStreamName: 'userAccount',
});

// Clickhouse Logger
const ClickhouseLogger = new CustomLogger({
  destination: streamDestination,
  level: 'debug',
  logGroupName: '/aws/ec2/efflux-be-' + loggingEnv,
  logStreamName: 'clickhouse',
});

// Server Logger
const ServerLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  logGroupName: '/aws/ec2/efflux-be-' + loggingEnv,
  logStreamName: 'server',
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
  SedoLogger,
  TonicLogger,
  MediaNetLogger,
  PixelsLogger,
  UserLogger,
  OrganizationLogger,
  InsightsLogger,
  AdsetLogger,
  AdsLogger,
  CampaignsLogger,
  UserAccountLogger,
  ClickhouseLogger,
  ServerLogger
};
