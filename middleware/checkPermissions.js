const checkPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    const userPermissions = req.user.permissions;

    // Check if user has any of the required permissions
    const hasPermission = requiredPermissions.some((requiredPermission) =>
      userPermissions.includes(requiredPermission),
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
