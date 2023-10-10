// Local application imports
const UserRepository = require("../repositories/UserRepository");

class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  // Save a single user to the database
  async saveUser(user) {
    return await this.userRepository.saveOne(user);
  }

  // Save multiple users to the database in bulk
  async saveUsersInBulk(users, chunkSize = 500) {
    return await this.userRepository.saveInBulk(users, chunkSize);
  }

  // Update a user or users based on given criteria
  async updateUser(data, criteria) {
    return await this.userRepository.update(data, criteria);
  }

  // Delete a user or users based on given criteria
  async deleteUser(criteria) {
    return await this.userRepository.delete(criteria);
  }

  // Upsert users (insert or update) to the database in bulk
  async upsertUsers(users, chunkSize = 500) {
    return await this.userRepository.upsert(users, chunkSize);
  }

  // Fetch users from the database based on given fields, filters, and limit
  async fetchUsers(fields = ["*"], filters = {}, limit) {
    return await this.userRepository.fetchUsers(fields, filters, limit);
  }

  async fetchOne(fields = ["*"], filters = {}) {
    return await this.userRepository.fetchOne(fields, filters);
  }

}

module.exports = UserService;
