const { NotFound } = require('http-errors');

module.exports = function ErrorHandler(err, req, res, next) {
  let { message } = err;
  let { statusCode } = err;

  if (!statusCode) {
    statusCode = 500;
  }

  if (err instanceof NotFound) {
    message = `${message} not found`;
  }

  if (statusCode >= 500) {
    console.error(err);
    message = 'Internal Server Error';
  }
  res.status(statusCode).json({ message });
}

