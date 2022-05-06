module.exports = (req, res, next) => {
  req.user.isAdmin = req.user.permissions.includes('admin');
  req.user.providerId = req.user.sub.split('|')[1];
  next();
}
