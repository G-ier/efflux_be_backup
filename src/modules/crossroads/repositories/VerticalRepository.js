const _ = require("lodash");
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");
const Vertical = require("../entities/Vertical");

class VerticalRepository {
  constructor(database) {
    this.tableName = "verticals";
    this.database = database || new DatabaseRepository();
  }

  async saveOne(vertical) {
    const dbObject = this.toDatabaseDTO(vertical);
    return await this.database.insert(this.tableName, dbObject);
  }

  async saveInBulk(verticals, chunkSize = 500) {
    let data = verticals.map((vertical) => this.toDatabaseDTO(vertical));
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

  async upsert(verticals, chunkSize = 500) {
    const dbObjects = verticals.map((vertical) => this.toDatabaseDTO(vertical));
    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, "provider_id,provider");
    }
  }

  async fetchVerticals(fields = ["*"], filters = {}, limit) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results
  }

  toDatabaseDTO(vertical) {
    return {
      name: vertical.name,
      provider_id: vertical.provider_id,
      provider: vertical.provider,
    };
  }

  toDomainEntity(dbObject) {
    return new Vertical(
      dbObject.id,
      dbObject.name,
      dbObject.provider_id,
      dbObject.provider,
    );
  }
}

module.exports = VerticalRepository;
