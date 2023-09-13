const UserAccountService = require("../services/UserAccountService");

class UserAccountController {
  constructor() {
    this.userAccountService = new UserAccountService();
  }
}

module.exports = UserAccountController;
