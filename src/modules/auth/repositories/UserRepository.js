const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');
const User = require('../entities/User');
const { getAsync, setAsync } = require('../../../shared/helpers/redisClient');
const { UserLogger } = require('../../../shared/lib/WinstonLogger');

class UserRepository {
  constructor(database) {
    this.tableName = 'users';
    this.database = database || new DatabaseRepository();
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
    return await this.database.update(this.tableName, data, criteria);
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

  async fetchUsers(fields = ['*'], filters = {}, limit) {
    // Check if users are in cache
    const cacheKey = `users:${JSON.stringify({ fields, filters, limit })}`;

    const cachedUsers = await getAsync(cacheKey);
    if (cachedUsers) {
      UserLogger.debug('Fetching users from cache');

      return JSON.parse(cachedUsers).map(this.toDomainEntity);
    }

    // If not in cache, fetch from the database
    const results = await this.database.query(this.tableName, fields, filters, limit);

    // Set cache
    UserLogger.debug('Setting users in cache');
    await setAsync(cacheKey, JSON.stringify(results), 'EX', 3600); // Expires in 1 hour

    return results.map(this.toDomainEntity);
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
    // Check if user is in cache
    const cacheKey = `user:${JSON.stringify({ fields, filters })}`;

    const cachedUser = await getAsync(cacheKey);
    if (cachedUser) {
      UserLogger.debug('Fetched: ' + cacheKey + ' from cache');
      return JSON.parse(cachedUser);
    }

    // If not in cache, fetch from the database
    const result = await this.database.queryOne(this.tableName, fields, filters);

    // Set cache
    UserLogger.debug('Setting: ' + cacheKey + ' in cache');
    await setAsync(cacheKey, JSON.stringify(result), 'EX', 3600); // Expires in 1 hour

    return result;
  }

  toDatabaseDTO(user) {
    return {
      name: user.name,
      email: user.email,
      image_url: user.image_url,
      nickname: user.nickname,
      sub: user.sub,
      acct_type: user.acct_type,
      org_id: user.org_id,
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
