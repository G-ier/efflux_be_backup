const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');
const User = require('../entities/User');
const redisClient = require('../../../shared/lib/RedisConnection');

class UserRepository {
  constructor(database) {
    this.tableName = 'users';
    this.database = database || new DatabaseRepository();
  }

  async saveOne(user) {
    const dbObject = this.toDatabaseDTO(user);
    const insertResult = await this.database.insert(this.tableName, dbObject);

    // Delete users from cache
    const cacheKey = `users:*`;
    await redisClient.delAsync(cacheKey);

    return insertResult;
  }

  async saveInBulk(users, chunkSize = 500) {
    let data = users.map((user) => this.toDatabaseDTO(user));
    let dataChunks = _.chunk(data, chunkSize);

    for (let chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk);
    }

    // Delete users from cache
    const cacheKey = `users:*`;
    await redisClient.delAsync(cacheKey);
  }

  async update(data, criteria) {
    // Delete users from cache
    const updateResult = await this.database.update(this.tableName, data, criteria);

    const cacheKey = `users:*`;
    await redisClient.delAsync(cacheKey);

    return updateResult;
  }

  async delete(criteria) {
    const deleteResult = await this.database.delete(this.tableName, criteria);

    // Delete users from cache
    const cacheKey = `users:*`;
    await redisClient.delAsync(cacheKey);

    return deleteResult;
  }

  async upsert(users, chunkSize = 500) {
    const dbObjects = users.map((user) => this.toDatabaseDTO(user));
    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, 'id');
    }
  }

  async fetchUsers(fields = ['*'], filters = {}, limit) {
    const cache = true;
    // If not in cache, fetch from the database
    const results = await this.database.query(this.tableName, fields, filters, limit, [], cache);
    return results;
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

  async fetchOne(fields = ['*'], filters = {}) {
    const cache = true;
    // If not in cache, fetch from the database
    const result = await this.database.queryOne(this.tableName, fields, filters, [], cache);
    return result;
  }

  async fetchUserPermissions(userId) {
    // Check if user permissions are in cache
    const cacheKey = `userPermissions:${userId}`;

    const cachedUserPermissions = await redisClient.getAsync(cacheKey);
    if (cachedUserPermissions) {
      UserLogger.debug('Fetched: ' + cacheKey + ' from cache');
      return JSON.parse(cachedUserPermissions);
    }

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
    UserLogger.debug('Setting: ' + cacheKey + ' in cache');
    await redisClient.setAsync(cacheKey, JSON.stringify(userPermissions), 'EX', 3600); // Expires in 1 hour

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
