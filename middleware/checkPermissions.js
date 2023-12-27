const { getAsync, setAsync } = require('../src/shared/helpers/redisClient');
const { UserLogger } = require('../src/shared/lib/WinstonLogger');

const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    const userId = req.user.id; // Assuming req.user is populated by authentication middleware

    // Fetch user role and permissions from the database
    let userPermissionNames = [];

    // Check if user permissions are in cache
    const cacheKey = `userPermissions:${userId}`;

    const cachedUserPermissions = await getAsync(cacheKey);
    if (cachedUserPermissions) {
      UserLogger.debug('Fetched: ' + cacheKey + ' from cache');
      // Map to permission names for easier checking
      userPermissionNames = JSON.parse(cachedUserPermissions).map((permission) => permission.name);
    } else {
      // If not in cache, fetch from the database
      const userPermissions = await knex('role_permissions as rp')
        .join('permissions as p', 'p.id', 'rp.permission_id')
        .join('roles as r', 'r.id', 'rp.role_id')
        .join('users as u', 'u.role_id', 'r.id')
        .where('u.id', userId)
        .select('p.name');

      // Set cache
      UserLogger.debug('Setting: ' + cacheKey + ' in cache');
      await setAsync(cacheKey, JSON.stringify(userPermissions), 'EX', 3600); // Expires in 1 hour

      // Map to permission names for easier checking
      userPermissionNames = userPermissions.map((permission) => permission.name);
    }
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
