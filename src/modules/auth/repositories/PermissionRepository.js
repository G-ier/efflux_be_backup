const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');
const Permission = require('../entities/Permission');

class PermissionRepository {

  constructor(database) {
    this.tableName = 'permissions';
    this.database = database || new DatabaseRepository();
  }

  async saveOne(permission) {
    const dbObject = this.toDatabaseDTO(permission);
    return await this.database.insert(this.tableName, dbObject);
  }

  async saveInBulk(permissions, chunkSize = 500) {
    const data = permissions.map((permission) => this.toDatabaseDTO(permission));
    const dataChunks = _.chunk(data, chunkSize);

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

  async fetchPermissions(fields = ['*'], filters = {}, limit, joins = []) {
    const results = await this.database.query(this.tableName, fields, filters, limit, joins);
    return results;
  }

  async fetchOne(fields = ['*'], filters = {}) {
    const result = await this.database.queryOne(this.tableName, fields, filters, []);
    return result;
  }
  
  toDatabaseDTO(permission) {
    return {
      name: permission.name,
      description: permission.description,
      is_active: permission.is_active,
      created_at: permission.created_at,
      updated_at: permission.updated_at,
    };
  }

  toDomainEntity(dbObject) {
    return new Permission(
      dbObject.id,
      dbObject.name,
      dbObject.description,
      dbObject.is_active,
      dbObject.created_at,
      dbObject.updated_at,
    );
  }

  // Additional methods specific to permission management can be added here
}

module.exports = PermissionRepository;
