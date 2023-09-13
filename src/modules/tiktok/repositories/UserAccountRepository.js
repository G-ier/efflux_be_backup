const _ = require("lodash");

const db = require("../../../../data/dbConfig");
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
      await this.database.upsert(this.tableName, chunk, "token")
    }
  }

  async fetchUserAccounts(fields = ["*"], filters = {}, limit) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results;
  }

  toDatabaseDTO(user_account) {
    return user_account;
  }

  toDomainEntity(dbObject) {
    return new Adset();
  }
}

module.exports = UserAccountRepository;
