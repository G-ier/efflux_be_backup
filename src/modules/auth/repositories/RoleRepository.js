const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');
const Role = require('../entities/Role');

class RoleRepository {

  constructor(database) {
    this.tableName = 'roles';
    this.database = database || new DatabaseRepository();
  }

  async saveOne(role) {
    const dbObject = this.toDatabaseDTO(role);
    return await this.database.insert(this.tableName, dbObject);
  }

  async saveInBulk(roles, chunkSize = 500) {
    const data = roles.map((role) => this.toDatabaseDTO(role));
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

 
  async fetchRoles(fields = ['*'], filters = {}, limit, joins = []) {
    const { sqlQuery, cache } = this.buildQueryAndGroupBy(this.tableName, fields, filters, joins, limit);
    const results = await this.database.raw(sqlQuery, cache);
    return results.rows;
  }

  async fetchOne(fields = ['*'], filters = {}) {
    const { sqlQuery, cache } = this.buildQueryAndGroupBy(this.tableName, fields, filters, [], 1);
    const result = await this.database.raw(sqlQuery, cache);
    return result.rows[0] || null;
  }

  buildQueryAndGroupBy(tableName, fields, filters, joins = [], limit = null) {
    const cache = true;
    const roleFields = fields.map((field) => `${tableName}.${field}`);
    let sqlQuery = `
      SELECT 
      ${roleFields.join(', ')}, 
      ARRAY_AGG(DISTINCT permissions.name) as permissions
      FROM ${tableName}
      LEFT JOIN role_permissions ON ${tableName}.id = role_permissions.role_id
      LEFT JOIN permissions ON role_permissions.permission_id = permissions.id
    `;

    if (Object.keys(filters).length) {
      const filterConditions = Object.entries(filters).map(([key, value]) => `${tableName}."${key}" = '${value}'`);
      sqlQuery += ` WHERE ${filterConditions.join(' AND ')}`;
    }

    const groupBy = [`${tableName}.id`, ...joins];
    sqlQuery += ` GROUP BY ${groupBy.join(', ')}`;

    if (limit) {
      sqlQuery += ` LIMIT ${limit}`;
    }

    return { sqlQuery, cache };
  }

  toDatabaseDTO(role) {
    return {
      name: role.name,
      description: role.description,
      is_active: role.is_active,
      created_at: role.created_at,
      updated_at: role.updated_at,
    };
  }

  toDomainEntity(dbObject) {
    return new Role(
      dbObject.id,
      dbObject.name,
      dbObject.description,
      dbObject.is_active,
      dbObject.created_at,
      dbObject.updated_at,
    );
  }

  // Add any other specific methods that are required for Role entity management
}

module.exports = RoleRepository;
