const models = require("../common/models");

module.exports = async (req, res, next) => {
  req.user.isAdmin = req.user.permissions.includes('admin');
  req.user.providerId = req.user.sub.split('|')[1];
  const user = await models.findBy('users', {providerId: req.user.providerId})
  req.user = {...req.user, ...user}
  next();
}
