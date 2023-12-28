const _ = require("lodash");
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");
const ConversionRule = require("../entities/ConversionRules");

class ConversionRuleRepository {
  constructor(database) {
    this.tableName = "conversion_rules";
    this.database = database || new DatabaseRepository();
  }

  async saveOne(adAccount) {
    const dbObject = this.toDatabaseDTO(adAccount);
    return await this.database.insert(this.tableName, dbObject);
  }

  async saveInBulk(adAccounts, chunkSize = 500) {
    let data = adAccounts.map((adAccount) => toDatabaseDTO(adAccount));
    let dataChunks = _.chunk(data, chunkSize);
    for (let chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk);
    }
  }

  async upsert(conversionRules, chunkSize = 500) {
    const dbObjects = conversionRules.map((conversionRule) => this.toDatabaseDTO(conversionRule));
    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
        await this.database.upsert()
      await this.database.upsert(this.tableName, chunk, "id");
    }
    return dbObjects;
  }

  async fetchConversionRules(fields = ["*"], filters = {}, limit, joins = []) {
    const results = await this.database.query(this.tableName, fields, filters, limit, joins);
    return results;
  }

  toDatabaseDTO(conversionRule) {
    return {
        id: conversionRule.id,
        display_name: conversionRule.display_name,
        look_back_window: conversionRule.look_back_window,
        category: conversionRule.category,
        status: conversionRule.status,
        type: conversionRule.type,
        event_name: conversionRule.event_name,
        include_in_total_conversions: conversionRule.include_in_total_conversions,
        exclude_from_campaigns: conversionRule.exclude_from_campaigns,
        description: conversionRule.description,
        advertiser_id: conversionRule.advertiser_id,
        last_modified_by: conversionRule.last_modified_by,
        last_modified_at: conversionRule.last_modified_at
    };
  }

  toDomainEntity(dbObject) {
    return new ConversionRule({
        id: dbObject.id,
        display_name: dbObject.display_name,
        look_back_window: dbObject.look_back_window,
        category: dbObject.category,
        status: dbObject.status,
        type: dbObject.type,
        event_name: dbObject.event_name,
        include_in_total_conversions: dbObject.include_in_total_conversions,
        exclude_from_campaigns: dbObject.exclude_from_campaigns,
        description: dbObject.description,
        advertiser_id: dbObject.advertiser_id,
        last_modified_by: dbObject.last_modified_by,
        last_modified_at: dbObject.last_modified_at
      })
  }
}

module.exports = ConversionRuleRepository;