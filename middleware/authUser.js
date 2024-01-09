const UserService = require('../src/modules/auth/services/UserService');
const _ = require('lodash');

module.exports = async (req, res, next) => {
  req.user.isAdmin = req.user.permissions.includes('admin');
  req.user.providerId = req.user.sub.split('|')[1];
  let user = await new UserService().fetchOne(['*'], { providerId: req.user.providerId });
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
  }
  req.user = { ...req.user, ...user };
  next();
};
