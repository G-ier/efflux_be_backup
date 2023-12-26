const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');
const User = require('../entities/User');

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
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results.map(this.toDomainEntity);
  }

  // TODO: Implement this method
  async fetchUserOrganization(id) {
    // Step 1: Fetch the user from the database using the id parameter and the fetchOne method
    // Step 2: Fetch the organization from the database using the user's organization id
  }

  async fetchOne(fields = ['*'], filters = {}) {
    const result = await this.database.queryOne(this.tableName, fields, filters);
    if (!fields.includes('*')) return result;
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
      account_parent: user.account_parent,
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
      dbObject.account_parent,
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
