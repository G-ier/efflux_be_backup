// Local application imports
const PermissionService = require('../services/PermissionService');

class PermissionsController {
  constructor() {
    this.permissionService = new PermissionService();
  }

  async savePermission(req, res) {
    const permission = req.body;
    const result = await this.permissionService.savePermission(permission);
    res.json(result);
  }

  async savePermissionsInBulk(req, res) {
    const { permissions, chunkSize } = req.body;
    const result = await this.permissionService.savePermissionsInBulk(permissions, chunkSize);
    res.json(result);
  }

  async updatePermission(req, res) {
    const { data, criteria } = req.body;
    const result = await this.permissionService.updatePermission(data, criteria);
    res.json(result);
  }

  async deletePermission(req, res) {
    const { criteria } = req.body;
    const result = await this.permissionService.deletePermission(criteria);
    res.json(result);
  }

  async fetchPermissions(req, res) {
    const { fields, filters, limit } = req.query;
    const results = await this.permissionService.fetchPermissions(fields, filters, limit);
    res.json(results);
  }

  async fetchOne(req, res) {
    const { fields, filters } = req.query;
    const result = await this.permissionService.fetchOne(fields, filters);
    res.json(result);
  }
}

module.exports = PermissionsController;
