// Third party imports
const _ = require("lodash");

// Local application imports
const UserAccount = require("../entities/UserAccount");
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");

class UserAccountRepository {

  constructor(database) {
    this.tableName = "user_accounts";
    this.database = database || new DatabaseRepository();
  }

  async upsert(user_accounts, chunkSize = 500) {
    let data = user_accounts.map((user_account) => this.toDatabaseDTO(user_account));
    const dataChunks = _.chunk(data, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, "name")
    }
  }

  async fetchUserAccounts(fields = ["*"], filters = {}, limit) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results;
  }

  async delete(criteria) {
    return await this.database.delete(this.tableName, criteria);
  }

  toDatabaseDTO(user_account) {
    return user_account;
  }

  toDomainEntity(dbObject) {
    return new Adset();
  }
}

module.exports = UserAccountRepository;
