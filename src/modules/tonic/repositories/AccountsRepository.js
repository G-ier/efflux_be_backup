// Third Party Imports
const _                           = require("lodash");

// Local Imports
const DatabaseRepository          = require("../../../shared/lib/DatabaseRepository");


class AccountsRepository {

  constructor() {
    this.tableName = "tonic_accounts";
    this.database = new DatabaseRepository();
  }

  async fetchAccounts(fields = ["*"], filters = {}, limit) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results;
  }

}

module.exports = AccountsRepository;
