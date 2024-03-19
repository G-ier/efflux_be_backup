// Local application imports
const { RequestsLogger } = require('../src/shared/lib/WinstonLogger');
const printDebug = false;

// Third party imports
const { v4: uuidv4 } = require('uuid');

const routesLogger = async (req, res, next) => {
  const { method, url, headers, query, body } = req;
  const requestId = uuidv4(); // Generate a unique UUID for this request/response pair

  const originalSend = res.send;
  res.send = function () {
    const code = res.statusCode;
    const logMessage = `[${requestId}]: Response - ${req.method} ${req.url}, with status ${res.statusCode} and body ${arguments[0]}`;
    if (code >= 400) RequestsLogger.error(logMessage);

    // only log if debug is enabled
    if (printDebug) {
      console.debug(logMessage);
      RequestsLogger.debug(logMessage);
    }

    originalSend.apply(res, arguments);
  };

  if (printDebug) {
    console.debug(
      `[${requestId}]: Request - ${method} ${url} ${JSON.stringify({ headers, query, body })}`,
    );
    RequestsLogger.info(
      `[${requestId}]: Request - ${method} ${url} ${JSON.stringify({ headers, query, body })}`,
    );
  }

  next();
};

module.exports = routesLogger;
