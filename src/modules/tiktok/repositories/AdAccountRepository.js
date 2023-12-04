const _ = require("lodash");
const AdAccount = require("../entities/AdAccounts");
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");

class AdAccountsRepository {
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

  async upsert(adAccounts, account_id, user_id, chunkSize = 500) {
    const dbObjects = adAccounts.map((adAccount) => this.toDatabaseDTO(adAccount, account_id, user_id));
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

  toDatabaseDTO(adAccount, account_id, user_id) {
    return {
      name: adAccount.name,
      provider: "tiktok",
      provider_id: adAccount.advertiser_id,
      status: "active",
      user_id: user_id,
      account_id: account_id,
      fb_account_id: adAccount.advertiser_id,
      amount_spent: adAccount.amount_spent ?? 0,
      balance: adAccount.balance,
      spend_cap: adAccount?.amount_spent?.spend_cap ?? 0,
      currency: "USD",
      tz_name: adAccount.display_timezone,
      tz_offset: adAccount.timezone.replace(/^\D+/g, ""),
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

module.exports = AdAccountsRepository;
