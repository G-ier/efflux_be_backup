const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");
const UserAccount = require("../entities/UserAccount");

class UserAccountRepository {
  constructor(database) {
    this.tableName = "user_accounts";
    this.database = database || new DatabaseRepository();
  }

  async saveOne(userAccount) {
    const dbObject = this.toDatabaseDTO(userAccount);
    return await this.database.insert(this.tableName, dbObject);
  }

  async saveInBulk(userAccounts, chunkSize = 500) {
    let data = userAccounts.map((userAccount) => toDatabaseDTO(userAccount))
    let dataChunks = _.chunk(data, chunkSize)
    for (let chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk)
    }
  }

  async update(data, criteria) {
    return await this.database.update(this.tableName, data, criteria);
  }

  async delete(criteria) {
    return await this.database.delete(this.tableName, criteria);
  }

  async upsert(userAccounts, chunkSize = 500) {
    const dbObjects = userAccounts.map((userAccount) => this.toDatabaseDTO(userAccount));
    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, "provider_id");
    }
  }

  async fetchUserAccounts(fields = ['*'], filters = {}, limit) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results;
  }

  toDatabaseDTO(userAccount) {
    return userAccount
  }

  toDomainEntity(dbObject) {
    return new UserAccount(
      dbObject.id,
      dbObject.name,
      dbObject.email,
      dbObject.image_url,
      dbObject.provider,
      dbObject.provider_id,
      dbObject.status,
      dbObject.token,
      dbObject.user_id,
      dbObject.created_at,
      dbObject.updated_at,
      dbObject.business_scoped_id,
      dbObject.org_id
    );
  }

}

module.exports = UserAccountRepository;
