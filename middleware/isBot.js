const isbot = require('isbot');

async function isBot(req, res, next) {
  req.isBot = isbot(req.get('user-agent'))
  // console.log('REQUEST FROM BOT', req.originalUrl);
  return next()
}

module.exports = isBot
