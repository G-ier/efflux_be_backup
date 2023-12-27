const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');
const Organization = require('../entities/Organization');
const { getAsync, setAsync } = require('../../../shared/helpers/redisClient');
const { OrganizationLogger } = require('../../../shared/lib/WinstonLogger');

class OrganizationRepository {
  constructor(database) {
    this.tableName = 'organizations';
    this.database = database || new DatabaseRepository();
  }

  async saveOne(organization) {
    const dbObject = this.toDatabaseDTO(organization);
    return await this.database.insert(this.tableName, dbObject);
  }

  async saveInBulk(organizations, chunkSize = 500) {
    let data = organizations.map((organization) => this.toDatabaseDTO(organization));
    let dataChunks = _.chunk(data, chunkSize);

    for (let chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk);
    }
  }

  async update(data, criteria) {
    return await this.database.update(this.tableName, data, criteria);
  }

  async delete(criteria) {
    return await this.database.delete(this.tableName, criteria);
  }

  async upsert(organizations, chunkSize = 500) {
    const dbObjects = organizations.map((organization) => this.toDatabaseDTO(organization));
    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, 'id');
    }
  }

  async fetchOne(fields = ['*'], filters = {}) {
    // Check if organization is in cache
    const cacheKey = `organizations:${JSON.stringify({ fields, filters })}`;

    const cachedOrganization = await getAsync(cacheKey);
    if (cachedOrganization) {
      OrganizationLogger.debug('Fetched: ' + cacheKey + ' from cache');
      return JSON.parse(cachedOrganization);
    }
    // If not in cache, fetch from the database
    OrganizationLogger.debug('Fetching organization from database');
    const result = await this.database.queryOne(this.tableName, fields, filters);

    // Set cache
    OrganizationLogger.debug('Setting: ' + cacheKey + ' in cache');
    await setAsync(cacheKey, JSON.stringify(result), 'EX', 3600); // Expires in 1 hour

    return result;
  }

  toDatabaseDTO(organization) {
    return {
      name: organization.name,
      admin_id: organization.admin_id,
      created_at: organization.created_at,
      updated_at: organization.updated_at,
      is_active: organization.is_active,
    };
  }

  toDomainEntity(dbObject) {
    return new Organization(
      dbObject.id,
      dbObject.name,
      dbObject.admin_id,
      dbObject.created_at,
      dbObject.updated_at,
      dbObject.is_active,
    );
  }
}

module.exports = OrganizationRepository;
