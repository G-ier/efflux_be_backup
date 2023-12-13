const _ = require("lodash");
const Content = require("../entities/Content"); // Assuming you have a Content entity
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");

class AdLauncherMediaRepository {
  constructor(database) {
    this.tableName = "ad_launcher_media";
    this.database = database || new DatabaseRepository();
  }

  async saveOne(content) {
    const dbObject = this.toDatabaseDTO(content);
  
    // Check if a record with the same unique attributes already exists
    const existingRecord = await this.database
      .query(this.tableName,["*"],{ hash: dbObject.hash }) // Replace 'uniqueField' with the field(s) that uniquely identify your record
    
    if (existingRecord?.[0]) {
      // Record already exists, so skip insertion
      return existingRecord?.[0]; // or return some indicator that no new record was created
    } else {
      // Record does not exist, proceed with insertion
      const inserted = await this.database.insert(this.tableName,dbObject);
      return inserted;
    }
  }
  

  // Delete a single content record
  async deleteOne(contentId) {
    return await this.database.delete(this.tableName, { id: contentId });
  }

  // Update a single content record
  async updateOne(contentId, contentData) {
    const dbObject = this.toDatabaseDTO(contentData);
    return await this.database.update(this.tableName, dbObject, { id: contentId });
  }

  // Find a single content record
  async findOne(contentId) {
    const result = await this.database.query(this.tableName, ["*"], { id: contentId }, 1);
    if (result.length === 0) {
      return null;
    }
    return this.toDomainEntity(result[0]);
  }

  // Save multiple content records in bulk
  async saveInBulk(contents, chunkSize = 500) {
    let data = contents.map((content) => this.toDatabaseDTO(content));
    let dataChunks = _.chunk(data, chunkSize);
    for (let chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk);
    }
  }

  // Upsert multiple content records
  async upsert(contents, chunkSize = 500) {
    const dbObjects = contents.map((content) => this.toDatabaseDTO(content));
    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, "id"); // Assuming "id" is the unique identifier for upsert
    }
    return dbObjects;
  }

  // Fetch content records with optional fields and filters
  async fetchContents(fields = ["*"], filters = {}, limit) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results.map((result) => this.toDomainEntity(result));
  }

  // Convert Content entity to database object
  toDatabaseDTO(content) {
    return {
      type: content.type,
      url: content.url,
      hash: content.hash,
      ad_account_id: content.ad_account_id,
      created_at: content.created_at || new Date(),
      updated_at: new Date(),
    };
  }

  // Convert database object to Content entity
  toDomainEntity(dbObject) {
    return new Content(
      dbObject.type,
      dbObject.url,
      dbObject.hash,
      dbObject.created_at,
      dbObject.updated_at,
      dbObject.ad_account_id
    );
  }
}

module.exports = AdLauncherMediaRepository;
