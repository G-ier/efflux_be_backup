// Local application imports
const OrganizationRepository = require('../repositories/OrganizationRepository');

class OrganizationService {
  constructor() {
    this.organizationRepository = new OrganizationRepository();
  }

  // create a new organization
  async createOrganization(organization) {
    return await this.organizationRepository.create(organization);
  }

  // Save a single organization to the database
  async saveOrganization(organization) {
    return await this.organizationRepository.saveOne(organization);
  }

  // Save multiple organizations to the database in bulk
  async saveOrganizationsInBulk(organizations, chunkSize = 500) {
    return await this.organizationRepository.saveInBulk(organizations, chunkSize);
  }

  // Update a organization or organizations based on given criteria
  async updateOrganization(data, criteria) {
    return await this.organizationRepository.update(data, criteria);
  }

  // Delete a organization or organizations based on given criteria
  async deleteOrganization(criteria) {
    return await this.organizationRepository.delete(criteria);
  }

  // Fetch organizations from the database based on given fields, filters, and limit
  async fetchOrganizations(fields = ['*'], filters = {}, limit) {
    return await this.organizationRepository.fetchOrganizations(fields, filters, limit);
  }

  async fetchOne(fields = ['*'], filters = {}) {
    return await this.organizationRepository.fetchOne(fields, filters);
  }
}

module.exports = OrganizationService;
