const _ = require('lodash');
const AdsetMetadata = require('../entities/AdsetMetadata');
const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');

class AdsetMetadataRepository {
  constructor(database) {
    this.tableName = 'adset_metadata';
    this.database = database || new DatabaseRepository();
  }

  async saveOne(adset) {
    const dbObject = this.toDatabaseDTO(adset);
    return await this.database.insert(this.tableName, dbObject);
  }

  async updateOne(adset, criteria) {
    const dbObject = this.toDatabaseDTO(adset);
    return await this.database.update(this.tableName, dbObject, criteria);
  }

  async saveInBulk(adsets, chunkSize = 500) {
    let data = adsets.map((adset) => toDatabaseDTO(adset));
    let dataChunks = _.chunk(data, chunkSize);
    for (let chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk);
    }
  }

  async update(updateFields, criterion) {
    return await this.database.update(this.tableName, updateFields, criterion);
  }

  async fetchAdsetMetadata(fields = ['*'], filters = {}, limit, joins = []) {
    const results = await this.database.query(this.tableName, fields, filters, limit, joins);
    return results;
  }

  pickDefinedProperties(obj, keys) {
    return keys.reduce((acc, key) => {
      if (obj[key] !== undefined) {
        acc[key] = obj[key];
      }
      return acc;
    }, {});
  }

  async upsert(adsetData, adsetId, adsetMetadataId, trx) {
    if (!adsetData) {
      return null; // Return null if no data is provided
    }
  
    let adsetDbObject = this.toDatabaseDTO({
      ...adsetData,
      adset_id: adsetId
    });
  
    // Check if adsetMetadataId is provided and if the record exists
    let isNewRecord = false;
    if (adsetMetadataId) {
      const existingRecord = await this.database.connection
        .select('*')
        .from(this.tableName)
        .where('id', adsetMetadataId)
        .first()
        .transacting(trx);
  
      if (existingRecord) {
        // If the record exists, update it
        await this.database.connection
          .update(adsetDbObject)
          .from(this.tableName)
          .where('id', adsetMetadataId)
          .transacting(trx);
      } else {
        isNewRecord = true;
      }
    } else {
      isNewRecord = true;
    }
  
    // If adsetMetadataId is not provided or no existing record is found, insert a new record
    if (isNewRecord) {
      const [newId] = await this.database.connection
        .insert(adsetDbObject)
        .into(this.tableName)
        .transacting(trx)
        .returning('id'); // Make sure your DB supports the 'returning' method
  
      return newId;
    }
  
    return adsetMetadataId;
  }
  
  toDatabaseDTO(adset) {
    let mappedAdset = {
      ...adset,
      countries: adset.targeting?.geo_locations?.countries || adset.countries,
      click_through: adset.attribution_spec?.find((spec) => spec.event_type === 'CLICK_THROUGH')
        ?.window_days,
      view_through: adset.attribution_spec?.find((spec) => spec.event_type === 'VIEW_THROUGH')
        ?.window_days,
      pixel_id: adset.promoted_object?.pixel_id,
    };

    let dbObject = this.pickDefinedProperties(mappedAdset, [
      'id',
      'name',
      'daily_budget',
      'special_ad_categories',
      'special_ad_category_country',
      'dsa_beneficiary',
      'dsa_payor',
      'optimization_goal',
      'billing_event',
      'is_dynamic_creative',
      'age_min',
      'age_max',
      'countries',
      'user_os',
      'gender',
      'click_through',
      'view_through',
      'pixel_id',
      'adset_id',
    ]);

    return dbObject;
  }

  toDomainEntity(dbObject) {
    return new AdsetMetadata(
      dbObject.id,
      dbObject.name,
      dbObject.daily_budget,
      dbObject.special_ad_category,
      dbObject.special_ad_category_country,
      dbObject.dsa_beneficiary,
      dbObject.dsa_payor,
      dbObject.optimization_goal,
      dbObject.billing_event,
      dbObject.is_dynamic_creative,
      dbObject.age_min,
      dbObject.age_max,
      dbObject.countries,
      dbObject.user_os,
      dbObject.gender,
      dbObject.click_through,
      dbObject.view_through,
      dbObject.pixel_id,
      dbObject.adset_id,
      dbObject.created_at,
      dbObject.updated_at,
    );
  }
}

module.exports = AdsetMetadataRepository;
