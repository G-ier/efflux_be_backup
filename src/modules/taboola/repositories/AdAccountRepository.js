const _ = require("lodash");
const AdAccount = require("../../../shared/entities/AdAccount");
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");

class AdAccountRepository {
  constructor(database) {
    this.tableName = "ad_accounts";
    this.database = database || new DatabaseRepository();
  }

  async saveOne(adAccount) {
    const dbObject = this.toDatabaseDTO(adAccount);
    return await this.database.insert(this.tableName, dbObject);
  }

  async saveInBulk(adAccounts, chunkSize = 500) {
    let data = adAccounts.map((adAccount) => toDatabaseDTO(adAccount));
    let dataChunks = _.chunk(data, chunkSize);
    for (let chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk);
    }
  }

  async upsert(adAccounts, user_id, user_account_id, chunkSize = 500) {
    const dbObjects = adAccounts.map((adAccount) => this.toDatabaseDTO(adAccount, user_id, user_account_id));
    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, "provider, provider_id, account_id", ["user_id", "account_id"]);
    }
    return dbObjects;
  }

  async fetchAdAccounts(fields = ["*"], filters = {}, limit, joins = []) {
    const results = await this.database.query(this.tableName, fields, filters, limit, joins);
    return results;
  }

  toDatabaseDTO(adAccount, user_id, user_account_id) {
    return {
      name: adAccount.name,
      provider: "taboola",
      provider_id: adAccount.account_id,
      status: adAccount.is_active ===true ? "active": "disabled",
      user_id: user_id,
      account_id: user_account_id,
      fb_account_id: adAccount.advertiser_id,
      currency: adAccount.currency,
      tz_name: adAccount.time_zone_name,
    };
  }

  toDomainEntity(dbObject) {
    return new AdAccount(
      dbObject.name,
      dbObject.id,
      dbObject.amount_spent,
      dbObject.balance,
      dbObject.spend_cap,
      dbObject.currency,
      dbObject.timezone_name,
      dbObject.timezone_offset_hours_utc,
      dbObject.account_id
    );
  }
}

module.exports = AdAccountRepository;