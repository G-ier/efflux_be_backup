const DatabaseConnection = require("./DatabaseConnection");

class DatabaseRepository {

  constructor(connection) {
    this.connection = connection || new DatabaseConnection().getConnection();
  }

  async insert(table, dbObject, trx = null) {
    try {
      const connection = trx || this.connection;
      const insertValue =  await connection(table).insert(dbObject).returning("*");
      return insertValue;
    } catch (error) {
      console.error(`Failed to insert into table ${table}`, error);
      throw error;
    }
  }

  async upsert(tableName, data, conflictTarget = null, excludeFields = [], trx = null) {
    try {
      const insert = this.connection(tableName).insert(data).toString();
      
      // Add a RETURNING clause to get the ID of the inserted/updated row
      const returningClause = 'RETURNING id'; // Assuming 'id' is the primary key column
  
      // If conflictTarget is not provided, simply execute the insert query
      if (!conflictTarget) {
        const query = `${insert} ${returningClause}`;
        let result;
        if (trx) {
          result = await trx.raw(query);
        } else {
          result = await this.connection.raw(query);
        }
        return result.rows[0].id; // Adapt based on how your query returns data
      }
  
      const conflictKeys = Object.keys(data[0])
        .filter((key) => !excludeFields.includes(key))
        .map((key) => `${key} = EXCLUDED.${key}`)
        .join(", ");
  
      if (!conflictKeys) {
        throw new Error("No fields left to update after excluding.");
      }
  
      const query = `${insert} ON CONFLICT (${conflictTarget}) DO UPDATE SET ${conflictKeys} ${returningClause}`;
      
      let result;
      if (trx) {
        result = await trx.raw(query);
      } else {
        result = await this.connection.raw(query);
      }
      return result.rows[0].id; // Adapt based on how your query returns data
    } catch (error) {
      console.error("Error upserting row/s: ", error);
      throw error;
    }
  }
  
  async query(
    tableName,
    fields = ["*"],
    filters = {},
    limit,
    joins = []
  ) {
    try {
      let queryBuilder = this.connection(tableName).select(fields);

      // Handling joins
      for (const join of joins) {
        if (join.type === "inner") {
          queryBuilder = queryBuilder.join(join.table, join.first, join.operator, join.second);
        } else if (join.type === "left") {
          queryBuilder = queryBuilder.leftJoin(join.table, join.first, join.operator, join.second);
        }
      }

      // Apply filters to the query
      for (const [key, value] of Object.entries(filters)) {

        if (Array.isArray(value)) {
          queryBuilder = queryBuilder.whereIn(key, value);

        } else if (typeof value === 'object' && value !== null) {

          // Handle special filter conditions like greater than, less than, etc.
          if (value.gt !== undefined) {
            queryBuilder = queryBuilder.where(key, '>', value.gt);
          }
          if (value.lt !== undefined) {
            queryBuilder = queryBuilder.where(key, '<', value.lt);
          }
          if (value.gte !== undefined) {
            queryBuilder = queryBuilder.where(key, '>=', value.gte);
          }
          if (value.lte !== undefined) {
            queryBuilder = queryBuilder.where(key, '<=', value.lte);
          }
          // Add more conditions as needed
        } else {
          // Default case for direct equality
          queryBuilder = queryBuilder.where(key, value);
        }
      }

      if (limit) queryBuilder = queryBuilder.limit(limit);

      const results = await queryBuilder;
      return results;
    } catch (error) {
      console.error(`Error querying table ${tableName}`, error);
      throw error;
    }
  }

  async delete(tableName, filters, trx = null) {
    try {
      const connection = trx || this.connection;
      let queryBuilder = connection(tableName);

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
      const deletedRowCount = await queryBuilder.del();

      return deletedRowCount; // Return number of deleted rows
    } catch (error) {
      console.error(`Failed to delete from table ${tableName}`, error);
      throw error;
    }
  }

  async update(tableName, updatedFields, filters) {
    try {
      let queryBuilder = this.connection(tableName);

      // Update the fields
      queryBuilder = queryBuilder.update(updatedFields);

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

      const updatedRowCount = await queryBuilder;

      return updatedRowCount;
    } catch (error) {
      console.error(`Failed to update table ${tableName}`, error);
      throw error;
    }
  }

  async queryOne(tableName, fields = ["*"], filters = {}, orderBy = []) {
    try {
        let queryBuilder = this.connection(tableName).select(fields);

        for (const [key, value] of Object.entries(filters)) {
            if (Array.isArray(value)) {
                queryBuilder = queryBuilder.whereIn(key, value);
            } else {
                queryBuilder = queryBuilder.where(key, value);
            }
        }

        // Handle order by rules
        for (const rule of orderBy) {
            queryBuilder = queryBuilder.orderBy(rule.column, rule.direction);
        }

        const result = await queryBuilder.first();
        return result;
    } catch (error) {
        console.error(`Error querying table ${tableName}`, error);
        throw error;
    }
}

  async startTransaction() {
    return this.connection.transaction();
  }

  async raw(query) {
    try {
      const result = await this.connection.raw(query);
      return result;
    } catch (error) {
      console.error("Error executing raw query: ", error);
      throw error;
    }
  }

}

module.exports = DatabaseRepository;
