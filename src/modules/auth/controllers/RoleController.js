// Local application imports
const RoleService = require('../services/RoleService');

class RolesController {
  constructor() {
    this.roleService = new RoleService();
  }

  async saveRole(req, res) {
    const role = req.body;
    const result = await this.roleService.saveRole(role);
    res.json(result);
  }

  async saveRolesInBulk(req, res) {
    const { roles, chunkSize } = req.body;
    const result = await this.roleService.saveRolesInBulk(roles, chunkSize);
    res.json(result);
  }

  async updateRole(req, res) {
    const { data, criteria } = req.body;
    const result = await this.roleService.updateRole(data, criteria);
    res.json(result);
  }

  async deleteRole(req, res) {
    const { criteria } = req.body;
    const result = await this.roleService.deleteRole(criteria);
    res.json(result);
  }

  async fetchRoles(req, res) {
    const { fields, filters, limit } = req.query;
    const results = await this.roleService.fetchRoles(fields, filters, limit);
    res.json(results);
  }

  async fetchOne(req, res) {
    const { fields, filters } = req.query;
    const result = await this.roleService.fetchOne(fields, filters);
    res.json(result);
  }
}

module.exports = RolesController;
