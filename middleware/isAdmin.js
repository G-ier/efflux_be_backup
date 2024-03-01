const UserService = require('../src/modules/users/services/UserService');
const userService = new UserService();

const isAdmin = async (req, res, next) => {
  const userInfo = await userService.getUserById(req.user.id)
  if (userInfo.role !== 'admin') {
    return res.status(403).json({ message: 'You do not have permission to access this resource' });
  }
  next();
}

module.exports = isAdmin;
