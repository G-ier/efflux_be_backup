// Local application imports
const UserService = require('../services/UserService');

class UsersController {
  constructor() {
    this.userService = new UserService();
  }

  async saveUser(req, res) {
    const user = req.body;
    const result = await this.userService.saveUser(user);
    res.json(result);
  }

  async saveUsersInBulk(req, res) {
    const { users, chunkSize } = req.body;
    const result = await this.userService.saveUsersInBulk(users, chunkSize);
    res.json(result);
  }

  async fetchUserAdAccounts(req, res) {
    const { id } = req.params;
    const result = await this.userService.fetchUserAdAccounts(id);
    res.json(result);
  }

  async updateUser(req, res) {
    const { data, criteria } = req.body;
    const result = await this.userService.updateUser(data, criteria);
    res.json(result);
  }

  async deleteUser(req, res) {
    const { criteria } = req.body;
    const result = await this.userService.deleteUser(criteria);
    res.json(result);
  }

  async upsertUsers(req, res) {
    const { users, chunkSize } = req.body;
    const result = await this.userService.upsertUsers(users, chunkSize);
    res.json(result);
  }

  async fetchUsers(req, res) {
    const { fields, filters, limit } = req.query;
    const results = await this.userService.fetchUsers(fields, filters, limit);
    res.json(results);
  }
}

module.exports = UsersController;
