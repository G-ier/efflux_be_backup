// Third party imports
const { createLogger, format, transports } = require('winston');
const path = require('path');

// Local application imports
const EnvironmentVariablesManager = require('../services/EnvironmentVariablesManager');

class CustomLogger {
  constructor(options) {
    const { destination, level, pattern, filePath } = options;

    let logTransport;

    if (destination === 'file') {
      logTransport = new transports.File({ filename: filePath });
    } else {
      logTransport = new transports.Console();
    }

    this.logger = createLogger({
      level: level || 'info',
      format: format.combine(
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
      transports: [logTransport],
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
    ? 'file'
    : 'console';
const filePath = (msName) =>
  EnvironmentVariablesManager.getEnvVariable('LOGGING_ENVIRONMENT') === 'production'
    ? `./logs/${msName}.log`
    : null;

// Crossroads Logger
const CrossroadsLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  filePath: filePath('crossroads'),
});

// Facebook Logger
const FacebookLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  filePath: filePath('facebook'),
});

// Tiktok Logger
const TiktokLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  filePath: filePath('tiktok'),
});

// Taboola Logger
const TaboolaLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  filePath: filePath('taboola'),
});
// Capi Logger
const CapiLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  filePath: filePath('capi'),
});
// Aggregates Logger
const AggregatesLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  filePath: filePath('aggregates'),
});

// FunnelFlux Logger
const FunnelFluxLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  filePath: filePath('funnelFlux'),
});

// Postback Logger
const PostbackLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  filePath: filePath('postback'),
  pattern: '[{timestamp}]:[{level}] - {message}',
});

const PostbackTestLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  filePath: filePath('postback_test'),
  pattern: '[{timestamp}]:[{level}] - {message}',
});
// Requests Logger
const RequestsLogger = new CustomLogger({
  destination: 'file',
  level: 'info',
  filePath: './logs/requests.log',
  pattern: '[{timestamp}]:[{level}]:{message}',
});

// Sedo Logger
const SedoLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  filePath: filePath('sedo'),
});

// Tonic Logger
const TonicLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  filePath: filePath('tonic'),
});

// MediaNet Logger
const MediaNetLogger = new CustomLogger({
  destination:streamDestination,
  level: 'info',
  filePath: filePath('medianet')
});

// Analysis Logger
const AnalysisLogger = new CustomLogger({
  destination: streamDestination,
  level: 'info',
  filePath: filePath('analysis'),
});

// CRON data update Logger
const dataUpdatesLogger = new CustomLogger({
  destination: 'file',
  level: 'info',
  filePath: './logs/updates.log',
});

// User Logger
const UserLogger = new CustomLogger({
  destination: streamDestination,
  level: 'debug',
  filePath: filePath('./logs/user'),
});

// Organization Logger
const OrganizationLogger = new CustomLogger({
  destination: streamDestination,
  level: 'debug',
  filePath: filePath('./logs/organization'),
});

// Insights Logger
const InsightsLogger = new CustomLogger({
  destination: streamDestination,
  level: 'debug',
  filePath: filePath('./logs/insights'),
});

// Adset Logger
const AdsetLogger = new CustomLogger({
  destination: streamDestination,
  level: 'debug',
  filePath: filePath('./logs/adset'),
});

// Ads Logger
const AdsLogger = new CustomLogger({
  destination: streamDestination,
  level: 'debug',
  filePath: filePath('./logs/ads'),
});

// Campaigns Logger
const CampaignsLogger = new CustomLogger({
  destination: streamDestination,
  level: 'debug',
  filePath: filePath('./logs/campaigns'),
});

// Pixels Logger
const PixelsLogger = new CustomLogger({
  destination: streamDestination,
  level: 'debug',
  filePath: filePath('./logs/pixels'),
});

// UserAccount Logger
const UserAccountLogger = new CustomLogger({
  destination: streamDestination,
  level: 'debug',
  filePath: filePath('./logs/userAccount'),
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
  MediaNetLogger
};
