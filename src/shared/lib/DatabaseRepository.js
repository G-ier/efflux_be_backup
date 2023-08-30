const DatabaseConnection = require("./DatabaseConnection");

class DatabaseRepository {

  constructor(connection) {
    this.connection = connection || new DatabaseConnection().getConnection();
  }

  async insert(table, dbObject) {
    try {
      return await this.connection(table).insert(dbObject).returning("id");
    } catch (error) {
      console.error(`Failed to insert into table ${table}`, error);
      throw error;
    }
  }

  async upsert(tableName, data, conflictTarget, excludeFields = []) {
    try {
      const insert = this.connection(tableName).insert(data).toString();
      const conflictKeys = Object.keys(data[0])
        .filter(key => !excludeFields.includes(key))
        .map(key => `${key} = EXCLUDED.${key}`)
        .join(', ');
      if (!conflictKeys) {
        throw new Error("No fields left to update after excluding.");
      }
      const query = `${insert} ON CONFLICT (${conflictTarget}) DO UPDATE SET ${conflictKeys}`;
      await this.connection.raw(query);

    } catch (error) {
      console.error("Error upserting row/s: ", error);
      throw error;
    }
  }

  async query(tableName, fields = ['*'], filters = {}, limit) {

    try {
        // Start with a basic select on the given fields
        let queryBuilder = this.connection(tableName).select(fields);

        // Apply filters to the query
        for (const [key, value] of Object.entries(filters)) {
            if (Array.isArray(value)) {
                // If the filter value is an array, use "whereIn" for the filter
                queryBuilder = queryBuilder.whereIn(key, value);
            } else {
                // If not, use the standard "where" method
                queryBuilder = queryBuilder.where(key, value);
            }
        }

        // Apply the limit if provided
        if (limit) queryBuilder = queryBuilder.limit(limit);

        const results = await queryBuilder;
        return results;

    } catch (error) {
        console.error(`Error querying table ${tableName}`, error);
        throw error;
    }
  }
}

module.exports = DatabaseRepository;
