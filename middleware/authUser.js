const UserService = require("../src/modules/auth/services/UserService");

module.exports = async (req, res, next) => {
  req.user.isAdmin = req.user.permissions.includes('admin');
  req.user.providerId = req.user.sub.split('|')[1];
  const user = await new UserService().fetchOne(['*'], {providerId: req.user.providerId});
  req.user = {...req.user, ...user}
  next();
}
