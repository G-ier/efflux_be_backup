const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');
// const MemcachedConnection = require('../../../shared/lib/MemcachedConnection');
const User = require('../entities/User');

class UserRepository {
  constructor() {
    this.tableName = 'users';
    this.database = new DatabaseRepository();
  }

  async saveOne(user) {
    const dbObject = this.toDatabaseDTO(user);
    return await this.database.insert(this.tableName, dbObject);
  }

  async saveInBulk(users, chunkSize = 500) {
    let data = users.map((user) => this.toDatabaseDTO(user));
    let dataChunks = _.chunk(data, chunkSize);

    for (let chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk);
    }
  }

  async update(data, criteria) {
    try {
      const updated = await this.database.update(this.tableName, data, criteria);

      return updated;
    } catch (error) {
      console.error(`Error updating data in ${this.tableName}:`, error);
      throw error; // Rethrow or handle the error as appropriate for your application
    }
  }

  async delete(criteria) {
    return await this.database.delete(this.tableName, criteria);
  }

  async upsert(users, chunkSize = 500) {
    const dbObjects = users.map((user) => this.toDatabaseDTO(user));
    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, 'id');
    }
  }

  // Reusable function to build SQL query and group by fields
  buildQueryAndGroupBy(tableName, fields, filters, groupByFields = [], limit = null) {
    const cache = true;
    const userFields = fields.map((field) => `${tableName}.${field}`);

    let sqlQuery = `
      SELECT
      ${userFields.join(', ')},
      ARRAY_AGG(DISTINCT roles.name) as roles,
          ARRAY_AGG(DISTINCT permissions.name) as permissions
      FROM ${tableName}
      LEFT JOIN roles ON ${tableName}.role_id = roles.id
      LEFT JOIN role_permissions ON roles.id = role_permissions.role_id
      LEFT JOIN permissions ON role_permissions.permission_id = permissions.id
  `;

    if (Object.keys(filters).length) {
      const filterConditions = Object.entries(filters).map(
        ([key, value]) => `${tableName}."${key}" = '${value}'`,
      );
      sqlQuery += ` WHERE ${filterConditions.join(' AND ')}`;
    }

    // Group by user ID by default
    const groupBy = ['users.id', ...groupByFields];
    sqlQuery += ` GROUP BY ${groupBy.join(', ')}`;

    if (limit) {
      sqlQuery += ` LIMIT ${limit}`;
    }

    return { sqlQuery, cache };
  }

  async fetchUsers(fields = ['*'], filters = {}, limit) {
    const { sqlQuery, cache } = this.buildQueryAndGroupBy('users', fields, filters);
    const results = await this.database.raw(sqlQuery, cache);
    return results?.rows;
  }

  async fetchOne(fields = ['*'], filters = {}) {
    try {
      // Check if providerId is provided in filters and is valid
      const providerId = filters.providerId;

      // Build SQL query
      const { sqlQuery, cache } = this.buildQueryAndGroupBy('users', fields, filters);

      // Execute query against the database
      const result = await this.database.raw(sqlQuery, cache);
      const object = result?.rows?.[0];

      return object;
    } catch (error) {
      // Handle errors such as database connection issues
      console.error('Error in fetchOne:', error);
      throw error;
    }
  }

  // Tested by calling the route "http://localhost:5011/api/temp/user/23/organization"
  async fetchUserOrganization(id) {
    // Step 1: Fetch the user from the database
    const user = await this.fetchOne(['*'], { id });

    // Step 2: Fetch the organization from the database using the user's org_id
    const organization = await this.database.queryOne('organizations', ['*'], {
      id: user.org_id,
    });

    // Step 3: Return the organization
    return organization;
  }

  async fetchUserPermissions(userId) {
    // Check if user permissions are in cache
    // const cacheKey = `userPermissions:${userId}`;

    // const cachedUserPermissions = await getAsync(cacheKey);
    // if (cachedUserPermissions) {
    //   UserLogger.debug('Fetched: ' + cacheKey + ' from cache');
    //   return JSON.parse(cachedUserPermissions);
    // }

    const databaseRepository = new DatabaseRepository();
    // If not in cache, fetch from the database
    const userPermissions = await databaseRepository.raw(
      `
        SELECT permissions.name
        FROM users
        INNER JOIN roles ON users.role_id = roles.id
        INNER JOIN role_permissions ON roles.id = role_permissions.role_id
        INNER JOIN permissions ON role_permissions.permission_id = permissions.id
        WHERE users.id = ${userId};
      `,
    );

    // Set cache
    // UserLogger.debug('Setting: ' + cacheKey + ' in cache');
    // await setAsync(cacheKey, JSON.stringify(userPermissions), 'EX', 3600); // Expires in 1 hour

    return userPermissions;
  }

  toDatabaseDTO(user) {
    return {
      name: user.name,
      email: user.email,
      image_url: user.image_url,
      nickname: user.nickname,
      org_id: user.org_id,
      role_id: user.role_id,
      sub: user.sub,
      acct_type: user.acct_type,
      phone: user.phone,
      token: user.token,
      fbID: user.fbID,
      created_at: user.created_at,
      updated_at: user.updated_at,
      provider: user.provider,
      providerId: user.providerId,
    };
  }

  toDomainEntity(dbObject) {
    return new User(
      dbObject.id,
      dbObject.org_id,
      dbObject.role_id,
      dbObject.name,
      dbObject.email,
      dbObject.image_url,
      dbObject.nickname,
      dbObject.sub,
      dbObject.acct_type,
      dbObject.phone,
      dbObject.token,
      dbObject.fbID,
      dbObject.created_at,
      dbObject.updated_at,
      dbObject.provider,
      dbObject.providerId,
    );
  }
}

module.exports = UserRepository;
