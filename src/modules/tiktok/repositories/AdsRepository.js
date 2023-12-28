const _ = require('lodash');
const Ad = require('../entities/Ad');
const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');

class AdsRepository {
  constructor(database) {
    this.tableName = 'tiktok_ads';
    this.database = database || new DatabaseRepository();
  }

  async saveOne(ad) {
    const dbObject = this.toDatabaseDTO(ad);
    return await this.database.insert(this.tableName, dbObject);
  }

  async saveInBulk(ads, chunkSize = 500) {
    let data = ads.map((ad) => this.toDatabaseDTO(ad));
    let dataChunks = _.chunk(data, chunkSize);
    for (let chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk);
    }
  }

  async upsert(ads, adAccountsMap, chunkSize = 500) {
    const dbObjects = ads.map((ad) => this.toDatabaseDTO(ad, adAccountsMap));
    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, 'id');
    }
  }

  async fetchAds(fields = ['*'], filters = {}, limit) {
    const cache = true;
    const results = await this.database.query(this.tableName, fields, filters, limit, [], cache);
    return results
  }

  toDatabaseDTO(ad, adAccountsMap) {
    return {
      id: ad.ad_id,
      name: ad.ad_name,
      created_time: ad.create_time,
      traffic_source: 'tiktok',
      provider_id: ad.ad_id,
      status: ad.operation_status,
      user_id: adAccountsMap[ad.advertiser_id].user_id,
      account_id: adAccountsMap[ad.advertiser_id].account_id,
      ad_account_id: adAccountsMap[ad.advertiser_id].id,
      campaign_id: ad.campaign_id,
      ad_group_id: ad.adgroup_id,
      network: 'unknown',
    };
  }

  toDomainEntity(dbObject) {
    return new Ad(
      dbObject.id,
      dbObject.name,
      dbObject.created_time,
      dbObject.start_time,
      dbObject.created_at,
      dbObject.updated_at,
      dbObject.traffic_source,
      dbObject.provider_id,
      dbObject.status,
      dbObject.user_id,
      dbObject.account_id,
      dbObject.ad_account_id,
      dbObject.campaign_id,
      dbObject.ad_group_id,
      dbObject.network,
    );
  }
}

module.exports = AdsRepository;
