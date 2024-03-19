const isbot = require('isbot');

async function isBot(req, res, next) {
  req.isBot = isbot(req.get('user-agent'));
  return next();
}

module.exports = isBot;
