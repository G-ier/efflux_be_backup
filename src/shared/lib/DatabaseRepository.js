const DatabaseConnection = require('./DatabaseConnection');

class DatabaseRepository {
  constructor(connection) {
    this.connection = connection || new DatabaseConnection().getConnection();

    // We can include cache capabilities in the methods here, and they will get distributed to all the repositories
    // through inheritance. We can parametrize the function to conditionally use cache or not.
    this.enableCache = process.env.ENABLE_CACHE === 'true';

    if (this.enableCache) {
      const RedisConnection = require('./RedisConnection');
      this.redis = RedisConnection.getClient();
    }
  }

  async insert(table, dbObject, trx = null) {
    try {
      const connection = trx || this.connection;
      const insertValue = await connection(table).insert(dbObject).returning('*');
      return insertValue;
    } catch (error) {
      console.error(`Failed to insert into table ${table}`, error);
      throw error;
    }
  }

  async upsert(tableName, data, conflictTarget = null, excludeFields = [], trx = null) {
    try {
      const insert = this.connection(tableName).insert(data).toString();

      // If conflictTarget is not provided, simply execute the insert query
      if (!conflictTarget) {
        if (trx) {
          await trx.raw(insert);
        } else {
          await this.connection.raw(insert);
        }
        return;
      }

      const conflictKeys = Object.keys(data[0])
        .filter((key) => !excludeFields.includes(key))
        .map((key) => `${key} = EXCLUDED.${key}`)
        .join(', ');

      if (!conflictKeys) {
        throw new Error('No fields left to update after excluding.');
      }

      const query = `${insert} ON CONFLICT (${conflictTarget}) DO UPDATE SET ${conflictKeys}`;

      if (trx) {
        await trx.raw(query);
      } else {
        await this.connection.raw(query);
      }
    } catch (error) {
      console.error('Error upserting row/s: ', error);
      throw error;
    }
  }

  async query(tableName, fields = ['*'], filters = {}, limit, joins = [], cache = false) {
    try {
      if (cache && this.enableCache) {
        // Check if users are in cache
        console.log(`Fetching from cache: ${tableName}`);
        const cacheKey = `${tableName}:${JSON.stringify({ fields, filters, limit })}`;
        const cachedUsers = await this.redis.getAsync(cacheKey);
        return JSON.parse(cachedUsers);
      }

      let queryBuilder = this.connection(tableName).select(fields);

      // Handling joins
      for (const join of joins) {
        if (join.type === 'inner') {
          queryBuilder = queryBuilder.join(join.table, join.first, join.operator, join.second);
        } else if (join.type === 'left') {
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

      if (cache && this.enableCache) {
        // Set cache
        console.log(`Setting cache: ${tableName}`);
        await this.redis.setAsync(cacheKey, JSON.stringify(results), 'EX', 3600); // Expires in 1 hour
      }

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

  async queryOne(tableName, fields = ['*'], filters = {}, orderBy = [], cache = false) {
    try {
      if (cache && this.enableCache) {
        // Check if users are in cache
        console.log(`Fetching from cache: ${tableName}`);
        const cacheKey = `${tableName}:${JSON.stringify({ fields, filters })}`;
        const cachedUsers = await this.redis.getAsync(cacheKey);
        return JSON.parse(cachedUsers);
      }

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
      if (cache && this.enableCache) {
        // Set cache
        console.log(`Setting cache: ${tableName}`);
        await this.redis.setAsync(cacheKey, JSON.stringify(result), 'EX', 3600); // Expires in 1 hour
      }
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
      console.error('Error executing raw query: ', error);
      throw error;
    }
  }
}

module.exports = DatabaseRepository;
