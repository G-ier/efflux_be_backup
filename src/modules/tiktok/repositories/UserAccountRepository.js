// Third party imports
const _ = require('lodash');

// Local application imports
const UserAccount = require('../entities/UserAccount');
const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');
const { getAsync, setAsync } = require('../../../shared/helpers/redisClient');
const { UserAccountLogger } = require('../../../shared/lib/WinstonLogger');

class UserAccountRepository {
  constructor(database) {
    this.tableName = 'user_accounts';
    this.database = database || new DatabaseRepository();
  }

  async upsert(user_accounts, chunkSize = 500) {
    let data = user_accounts.map((user_account) => this.toDatabaseDTO(user_account));
    const dataChunks = _.chunk(data, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, 'name');
    }
  }

  async fetchUserAccounts(fields = ['*'], filters = {}, limit) {
    // Check if user_accounts are in cache
    const cacheKey = `user_accounts:${JSON.stringify({ fields, filters, limit })}`;

    const cachedUserAccounts = await getAsync(cacheKey);
    if (cachedUserAccounts) {
      UserAccountLogger.debug('Fetched: ' + cacheKey + ' from cache');
      return JSON.parse(cachedUserAccounts).map(this.toDomainEntity);
    }

    // If not in cache, fetch from the database
    UserAccountLogger.debug('Fetching user_accounts from database');
    const results = await this.database.query(this.tableName, fields, filters, limit);

    // Set cache
    UserAccountLogger.debug('Setting: ' + cacheKey + ' in cache');
    await setAsync(cacheKey, JSON.stringify(results), 'EX', 3600); // Expires in 1 hour

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
