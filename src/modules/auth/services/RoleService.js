// Local application imports
const RoleRepository = require('../repositories/RoleRepository');

class RoleService {
  constructor() {
    this.roleRepository = new RoleRepository();
  }

  // Save a single role to the database
  async saveRole(role) {
    return await this.roleRepository.saveOne(role);
  }

  // Save multiple roles to the database in bulk
  async saveRolesInBulk(roles, chunkSize = 500) {
    return await this.roleRepository.saveInBulk(roles, chunkSize);
  }

  // Update a role or roles based on given criteria
  async updateRole(data, criteria) {
    return await this.roleRepository.update(data, criteria);
  }

  // Delete a role or roles based on given criteria
  async deleteRole(criteria) {
    return await this.roleRepository.delete(criteria);
  }

  // Fetch roles from the database based on given fields, filters, and limit
  async fetchRoles(fields = ['*'], filters = {}, limit) {
    return await this.roleRepository.fetchRoles(fields, filters, limit);
  }

  async fetchOne(fields = ['*'], filters = {}) {
    return await this.roleRepository.fetchOne(fields, filters);
  }

}

module.exports = RoleService;
