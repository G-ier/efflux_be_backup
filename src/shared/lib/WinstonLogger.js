const { createLogger, format, transports } = require('winston');
const path = require('path');

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
                format.printf(info => {
                  let formattedPattern = pattern || '[{timestamp}][{filename}][{method}]:[{level}] - {message}';
                  return formattedPattern
                      .replace('{timestamp}', (info.timestamp || '').padEnd(25, ' '))    // Assuming 25 characters for timestamp
                      .replace('{filename}', (info.filename || '').padEnd(30, ' '))      // 30 characters for filename
                      .replace('{method}', (info.method || '').padEnd(40, ' '))          // Assuming 20 characters for method
                      .replace('{level}', (info.level))                                  // Assuming 10 characters for level
                      .replace('{message}', (info.message || ''));
              })
            ),
            transports: [logTransport]
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
      const stackList = (new Error()).stack.split('\n').slice(3);
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
              method: methodName
          }
      ];
  }

}

const streamDestination = process.env.LOGGING_ENVIRONMENT === "production" ? 'file' : 'console';
const filePath = (msName) => process.env.LOGGING_ENVIRONMENT === "production" ? `./logs/${msName}.log` : null;

// Crossroads Logger
const CrossroadsLogger = new CustomLogger({
  destination:streamDestination,
  level: 'info',
  filePath: filePath('crossroads')
});

// Facebook Logger
const FacebookLogger = new CustomLogger({
  destination:streamDestination,
  level: 'info',
  filePath: filePath('facebook')
});

// Tiktok Logger
const TiktokLogger = new CustomLogger({
  destination:streamDestination,
  level: 'info',
  filePath: filePath('tiktok')
});

const AggregatesLogger = new CustomLogger({
  destination:streamDestination,
  level: 'info',
  filePath: filePath('aggregates')
});

// CRON data update Logger
const dataUpdatesLogger = new CustomLogger({
  destination: 'file',
  level: 'info',
  filePath: './logs/updates.log'
});

module.exports = {
  CrossroadsLogger,
  FacebookLogger,
  TiktokLogger,
  AggregatesLogger,
  dataUpdatesLogger
};
