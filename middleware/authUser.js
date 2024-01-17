const UserService = require('../src/modules/auth/services/UserService');
const _ = require('lodash');

module.exports = async (req, res, next) => {
  console.log('USERUSERUSER');
  console.log(req.auth);

  // TODO: Fix isAdmin
  req.auth.isAdmin = req.auth.permissions.includes('admin');
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
  }

  req.user = { ...req.auth, ...user };
  console.log('REQREQREQ');
  console.log(req.user);
  next();
};
