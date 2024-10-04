// Local application imports
const BaseService                   = require("../../../shared/services/BaseService");
const AccountsRepository            = require("../repositories/AccountsRepository");
const { TonicLogger }               = require("../../../shared/lib/WinstonLogger");

class AccountService extends BaseService {

  constructor () {
    super(TonicLogger);
    this.repository = new AccountsRepository();
  }

  async fetchTonicAccounts() {
    return await this.repository.fetchAccounts();
  }

}

module.exports = AccountService;
