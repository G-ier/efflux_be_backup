const UserController = require('../src/modules/auth/controllers/UserController');

const checkPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    const userId = req.user.id; // Assuming req.user is populated by authentication middleware
    const userController = new UserController();

    const userPermissions = await userController.fetchUserPermissions(userId);

    // Map to permission names for easier checking
    const userPermissionNames = userPermissions.rows.map((permission) => permission.name);

    // Check if user has any of the required permissions
    const hasPermission = requiredPermissions.some((requiredPermission) =>
      userPermissionNames.includes(requiredPermission),
    );

    if (!hasPermission) {
      return res
        .status(403)
        .json({ message: 'You do not have the required permissions to access this route' });
    }

    next();
  };
};

module.exports = checkPermission;
