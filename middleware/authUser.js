const UserService = require('../src/modules/auth/services/UserService');
const _ = require('lodash');
const printDebug = false;

module.exports = async (req, res, next) => {
  req.auth.isAdmin = req.auth.permissions.includes('admin');
  if (printDebug) console.debug('req.auth.isAdmin: ', req.auth.isAdmin);
  req.auth.providerId = req.auth.sub.split('|')[1];

  let user = await new UserService().fetchOne(['*'], { providerId: req.auth.providerId });
  if (user) {
    user.roles = _.compact(user.roles);
    // Then, check if user.roles is empty
    if (_.isEmpty(user.roles)) {
      user.roles = [];
    }
    user.permissions = _.compact(user.permissions);
    // Then, check if user.roles is empty
    if (_.isEmpty(user.permissions)) {
      user.permissions = [];
    }
    if (printDebug) console.debug('user: ', user);
  }

  req.user = { ...req.auth, ...user };
  next();
};
