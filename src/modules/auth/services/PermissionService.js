// Local application imports
const PermissionRepository = require('../repositories/PermissionRepository');

class PermissionService {
  constructor() {
    this.permissionRepository = new PermissionRepository();
  }

  // Save a single permission to the database
  async savePermission(permission) {
    return await this.permissionRepository.saveOne(permission);
  }

  // Save multiple permissions to the database in bulk
  async savePermissionsInBulk(permissions, chunkSize = 500) {
    return await this.permissionRepository.saveInBulk(permissions, chunkSize);
  }

  // Update a permission or permissions based on given criteria
  async updatePermission(data, criteria) {
    return await this.permissionRepository.update(data, criteria);
  }

  // Delete a permission or permissions based on given criteria
  async deletePermission(criteria) {
    return await this.permissionRepository.delete(criteria);
  }

  // Fetch permissions from the database based on given fields, filters, and limit
  async fetchPermissions(fields = ['*'], filters = {}, limit) {
    return await this.permissionRepository.fetchPermissions(fields, filters, limit);
  }

  async fetchOne(fields = ['*'], filters = {}) {
    return await this.permissionRepository.fetchOne(fields, filters);
  }

  // Additional methods specific to permission management can be added here
}

module.exports = PermissionService;
