const UserService = require('../services/UserService');
class UserController {

  constructor() {
    this.userService = new UserService();
  }

  async listUsers(req, res) {
    try {
      const data = await this.userService.listUsers(req);
      res.json(data);
    } catch (err) {
      res.status(500).json(err.message);
    }
  }
}

module.exports = UserController;
