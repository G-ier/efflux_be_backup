const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");

class UserRepository {
  constructor(database) {
    this.tableName = 'users';
    this.database = database || new DatabaseRepository();

  }

  async getAllUsers(orgId, accountType = null, page = 1, pageSize = 500) {
    // Calculate the OFFSET based on the page number and page size
    const offset = (page - 1) * pageSize;
    let accountTypeFilter = '';
    if (accountType) {
      accountTypeFilter = `AND users.acct_type =  '${accountType}'`;
    }

    const sql = `
    SELECT
    ${this.tableName}.*,
      ARRAY_AGG(DISTINCT roles.name) as roles,
      ARRAY_AGG(DISTINCT permissions.name) as permissions
    FROM ${this.tableName}
      LEFT JOIN roles ON users.role_id = roles.id
      LEFT JOIN role_permissions ON roles.id = role_permissions.role_id
      LEFT JOIN permissions ON role_permissions.permission_id = permissions.id
    WHERE users.org_id = ${orgId} ${accountTypeFilter}
    GROUP BY users.id
    LIMIT ${pageSize} OFFSET ${offset};
    `
    const results = await this.database.raw(sql);
    return results.rows;
  }

  async getUserById(id) {
    const sql = `
    SELECT
      ${this.tableName}.*,
      roles.name as role
    FROM users
    JOIN roles ON roles.id = users.role_id
    WHERE users.id = ${id}
    `
    const results = await this.database.raw(sql);
    return results.rows[0];
  }
}

module.exports = UserRepository;
