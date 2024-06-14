// Third Party Imports
const _ = require('lodash');

// Local Imports
const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');

class AccountsRepository {
  constructor() {
    this.tableName = 'tonic_accounts';
    this.database = new DatabaseRepository();
  }

  /*
    Fetches multiple accounts.

    @param account_id: account id parameter of the required account
  */
  async fetchAccounts(fields = ['*'], filters = {}, limit) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results;
  }

  /*
    Fetches a single account.

    @param account_id: account id parameter of the required account
  */
  async fetchAccount(account_id) {
    const fields = ['*'];
    const filters = {};
    const limit = 1;
    const joins = [];
    const results = await this.database.query(this.tableName,fields, filters, null, joins);
    const filtered_result = results.filter(account => account.id == 1);
    return filtered_result[0];
  }
}

module.exports = AccountsRepository;
