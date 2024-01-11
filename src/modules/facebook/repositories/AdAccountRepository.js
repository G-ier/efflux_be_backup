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
      let data = adAccounts.map((adAccount) => toDatabaseDTO(adAccount))
      let dataChunks = _.chunk(data, chunkSize)
      for (let chunk of dataChunks) {
        await this.database.insert(this.tableName, chunk)
      }
    }

    async upsert(adAccounts, userId = null, accountId = null, chunkSize = 500) {
      const dbObjects = adAccounts.map((adAccount) => this.toDatabaseDTO(adAccount, userId, accountId));
      const dataChunks = _.chunk(dbObjects, chunkSize);
      for (const chunk of dataChunks) {
          await this.database.upsert(this.tableName, chunk, "provider, provider_id, account_id", ['user_id', 'account_id']);
      }
      return dbObjects;
    }

    async update(updateFields, criterion) {
      return await this.database.update(this.tableName, updateFields, criterion);
    }

    async fetchAdAccounts(fields = ['*'], filters = {}, limit, joins = []) {
      const results = await this.database.query(this.tableName, fields, filters, limit, joins);
      return results;
    }

    async fetchAdAccountsMap(fields=['ua_aa_map.id', 'ua_id', 'aa_id', 'ua.name AS ua_name', 'aa.name AS aa_name'], 
    filters = {}, limit, joins = []){
      const joinAdAccount =  {
        type: "inner",
        table: "ad_accounts AS aa",
        first: `ua_aa_map.aa_id`,
        operator: "=",
        second: "aa.provider_id",
      }
      const joinUserAccount =  {
        type: "inner",
        table: "user_accounts AS ua",
        first: `ua_aa_map.ua_id`,
        operator: "=",
        second: "ua.id",
      }
      joins.push(joinAdAccount);
      joins.push(joinUserAccount);
      const results = await this.database.query("ua_aa_map", fields, filters, limit, joins);
      console.log("Results length: ", results.length, " Results: ", results);
      return results;
    }

    toDatabaseDTO(adAccount, userId = null, accountId = null) {
      return {
        name: adAccount.name,
        provider: "facebook",
        provider_id: adAccount.id.replace(/^act_/, ""),
        status: "active",
        user_id: userId,
        account_id: accountId,
        fb_account_id: adAccount.account_id,
        amount_spent: adAccount.amount_spent,
        balance: adAccount.balance,
        spend_cap: adAccount.spend_cap,
        currency: adAccount.currency,
        tz_name: adAccount.timezone_name,
        tz_offset: adAccount.timezone_offset_hours_utc
      }
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
