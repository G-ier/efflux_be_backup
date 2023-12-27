// Local application imports
const OrganizationService = require('../services/OrganizationService');

class OrganizationController {
  constructor() {
    this.organizationService = new OrganizationService();
  }

  async saveOrganization(req, res) {
    const organization = req.body;
    const result = await this.organizationService.saveOrganization(organization);
    res.json(result);
  }

  async fetchOrganization(req, res) {
    const { organizationId } = req.params;
    const result = await this.organizationService.fetchOrganization(organizationId);
    res.json(result);
  }

  async deleteOrganization(req, res) {
    const { criteria } = req.body;
    const result = await this.organizationService.deleteOrganization(criteria);
    res.json(result);
  }
}

module.exports = OrganizationController;
