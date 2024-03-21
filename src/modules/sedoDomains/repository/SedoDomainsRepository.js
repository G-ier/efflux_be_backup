const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');
const SedoDomains = require('../entities/SedoDomains');

class SedoDomainsRepository {
  constructor() {
    this.tablename = 'sedo_domains';
    this.database = new DatabaseRepository();
  }

  async fetchSedoDomains(fields = ['*'], filters = {}, limit) {
    const cache = true;
    // If not in cache, fetch from the database
    const results = await this.database.query(this.tablename, fields, filters, limit, [], cache);
    return results;
  }

  toDomainEntity(dbObject) {
    return new SedoDomains(dbObject);
  }
}

module.exports = SedoDomainsRepository;
