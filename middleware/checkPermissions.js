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

    // Check if user has the required permission
    const hasPermission = userPermissions.some(
      (permission) => permission.name === requiredPermission,
    );

    if (!hasPermission) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next(); // Move to next middleware or route handler
  };
};

module.exports = checkPermission;
