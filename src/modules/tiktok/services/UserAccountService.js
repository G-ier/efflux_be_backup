const axios = require("axios");
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");
const UserAccountRepository = require("../repositories/UserAccountRepository");

class UserAccountService {
  constructor() {
    this.database = new DatabaseRepository();

    this.userAccountRepostiory = new UserAccountRepository();
  }
  async getUserAccounts(provider) {
    return await this.userAccountRepostiory.getUserAccounts(provider);
  }
}

module.exports = UserAccountService;
