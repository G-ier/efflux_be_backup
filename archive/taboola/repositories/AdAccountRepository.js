const _ = require("lodash");
const AdAccount = require("../../../shared/entities/AdAccount");
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");

class AdAccountRepository {
  constructor(database) {
    this.tableName = "ad_accounts";
    this.userAccountsAssociationTableName = "ua_aa_map";
    this.userAssociationTableName = "u_aa_map";
    this.priorityTable = 'aa_prioritized_ua_map';
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

  async upsertUserAccountsAssociation(adAccountIds, userAccountId, chunkSize = 500) {

    const dbObjects = adAccountIds.map((id) => {
      return {
        ua_id: userAccountId,
        aa_id: id
      }
    })

    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
        await this.database.upsert(this.userAccountsAssociationTableName, chunk, "ua_id, aa_id");
        await this.database.upsert(this.priorityTable, chunk, "aa_id", ["aa_id"]);
    }

    return dbObjects;
  }

  async upsertUserAssociation(adAccountIds, userId, chunkSize = 500) {

    const dbObjects = adAccountIds.map((id) => {
      return {
        u_id: userId,
        aa_id: id
      }
    })

    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
        await this.database.upsert(this.userAssociationTableName, chunk, "u_id, aa_id");
    }

    return dbObjects;
  }

  async upsertAdAccounts(adAccounts, chunkSize = 500) {
    const dbObjects = adAccounts.map((adAccount) => this.toDatabaseDTO(adAccount));
    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, "provider_id");
    }
    return dbObjects;
  }

  async fetchAdAccounts(fields = ["*"], filters = {}, limit, joins = []) {
    const results = await this.database.query(this.tableName, fields, filters, limit, joins);
    return results;
  }

  toDatabaseDTO(adAccount) {

    const getOffset = (timeZone = 'UTC', date = new Date()) => {
      const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
      const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
      return (tzDate - utcDate) / 3.6e6;
    }

    return {
      name: adAccount.name,
      provider: "taboola",
      provider_id: adAccount.account_id,
      status: adAccount.is_active ===true ? "active": "disabled",
      fb_account_id: adAccount.id,
      currency: adAccount.currency,
      tz_name: adAccount.time_zone_name,
      tz_offset: getOffset(adAccount.time_zone_name)
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
