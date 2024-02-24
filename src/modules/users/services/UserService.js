const UserRepository = require('../repositories/UserRepository');

class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async listUsers(req) {
    // get org info from the request
    const user = req.user;
    const orgId = user.org_id || null;
    return await this.userRepository.getAllUsers(orgId);
  }
}

module.exports = UserService;
