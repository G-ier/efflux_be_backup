// Local application imports
const UserRepository = require('../repositories/UserRepository');

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

  // Fetch the organization the user belongs to
  async fetchUserOrganization(userId) {
    return await this.userRepository.fetchUserOrganization(userId);
  }

  // Update a user or users based on given criteria
  async updateUser(data, criteria) {
    return await this.userRepository.update(data, criteria);
  }

  // Delete a user or users based on given criteria
  async deleteUser(id) {
    return await this.userRepository.delete(id);
  }

  // Upsert users (insert or update) to the database in bulk
  async upsertUsers(users, chunkSize = 500) {
    return await this.userRepository.upsert(users, chunkSize);
  }

  // Fetch users from the database based on given fields, filters, and limit
  async fetchUsers(fields = ['*'], filters = {}, limit) {
    return await this.userRepository.fetchUsers(fields, filters, limit);
  }

   // Get Users from database
   async getUsers() {
    return await this.userRepository.getUsers();
  }

  async fetchOne(fields = ['*'], filters = {}) {
    return await this.userRepository.fetchOne(fields, filters);
  }

  async fetchUserPermissions(userId) {
    return await this.userRepository.fetchUserPermissions(userId);
  }

  async createUser(userCreationResponseData, rights, password, username) {
    const creation_result = await this.userRepository.createUser(userCreationResponseData, rights, password, username);

    if(creation_result.insertion_result == "OK"){
      return {
        "insertion_result": "OK"
      }
    } else {
      return {
        "insertion_result": "FAILED"
      }
    }
  }

  async editUser(providerID, selectedUser, fullName, username, email, password, rights) {

    const edit_result = await this.userRepository.editUser(selectedUser, fullName, username, email, password, rights);

    if(edit_result.edit_result == "OK"){
      return {
        "edit_result": "OK"
      }
    } else {
      return {
        "edit_result": "FAILED"
      }
    }
  }
}

module.exports = UserService;
