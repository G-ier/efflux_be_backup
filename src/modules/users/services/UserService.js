const UserRepository = require('../repositories/UserRepository');

class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async listUsers(req) {
    // get org info from the request
    const user = req.user;
    const orgId = user.org_id || null;
    const { acct_type: accountType } = req.query;
    return await this.userRepository.getAllUsers(orgId, accountType);
  }

  async getUserById(id) {
    return await this.userRepository.getUserById(id);
  }
}

module.exports = UserService;
