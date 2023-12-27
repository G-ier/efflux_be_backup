const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    const userId = req.user.id; // Assuming req.user is populated by authentication middleware

    // Fetch user role and permissions from the database
    const userPermissions = await knex('role_permissions as rp')
      .join('permissions as p', 'p.id', 'rp.permission_id')
      .join('roles as r', 'r.id', 'rp.role_id')
      .join('users as u', 'u.role_id', 'r.id')
      .where('u.id', userId)
      .select('p.name');

    // Map to permission names for easier checking
    const userPermissionNames = userPermissions.map((permission) => permission.name);

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
