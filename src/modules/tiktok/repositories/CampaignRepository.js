const _ = require('lodash');
const Campaign = require('../entities/Campaign');
const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');
const { getAsync, setAsync } = require('../../../shared/helpers/redisClient');
const { CampaignsLogger } = require('../../../shared/lib/WinstonLogger');

class CampaignRepository {
  constructor(database) {
    this.tableName = 'campaigns';
    this.database = database || new DatabaseRepository();
  }

  async saveOne(campaign) {
    const dbObject = this.toDatabaseDTO(campaign);
    return await this.database.insert(this.tableName, dbObject);
  }

  async saveInBulk(campaigns, chunkSize = 500) {
    let data = campaigns.map((campaign) => toDatabaseDTO(campaign));
    let dataChunks = _.chunk(data, chunkSize);
    for (let chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk);
    }
  }

  async upsert(campaigns, adAccountsMap, chunkSize = 500) {
    const dbObjects = campaigns.map((campaign) => this.toDatabaseDTO(campaign, adAccountsMap));
    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, 'id');
    }
  }

  async updateOne(campaign, criteria) {
    const data = this.toDatabaseDTO(campaign);
    const dbObject = Object.keys(data).reduce((acc, key) => {
      if (data[key] != null) {
        // This will check for both null and undefined
        acc[key] = data[key];
      }
      return acc;
    }, {});

    return await this.database.update(this.tableName, dbObject, criteria);
  }

  async fetchCampaigns(fields = ['*'], filters = {}, limit, joins = []) {
    // Check if campaigns are in cache
    const cacheKey = `campaigns:${JSON.stringify({ fields, filters, limit, joins })}`;

    const cachedCampaigns = await getAsync(cacheKey);
    if (cachedCampaigns) {
      CampaignsLogger.debug('Fetched: ' + cacheKey + ' from cache');
      return JSON.parse(cachedCampaigns);
    }

    // If not in cache, fetch from the database
    CampaignsLogger.debug('Fetching campaigns from database');
    const results = await this.database.query(this.tableName, fields, filters, limit, joins);

    // Set cache
    CampaignsLogger.debug('Setting: ' + cacheKey + ' in cache');
    await setAsync(cacheKey, JSON.stringify(results), 'EX', 3600); // Expires in 1 hour

    return results;
  }

  async fetchAccountsEarliestCampaign(userAccountId) {
    const results = await this.database.raw(`
      SELECT
          TO_CHAR((created_time::timestamptz AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') AS date_in_utc
      FROM
          campaigns
      WHERE
          account_id = ${userAccountId}
      ORDER BY
          created_time::timestamptz
      LIMIT 1;
    `);
    return results.rows;
  }

  toDatabaseDTO(campaign, adAccountsMap) {
    return {
      id: campaign.campaign_id,
      name: campaign.campaign_name,
      created_time: campaign.create_time,
      updated_time: campaign.modify_time,
      traffic_source: 'tiktok',
      status: campaign.status || campaign.operation_status,
      user_id: adAccountsMap?.[campaign.advertiser_id].user_id,
      account_id: adAccountsMap?.[campaign.advertiser_id].account_id,
      ad_account_id: adAccountsMap?.[campaign.advertiser_id].id,
      daily_budget: campaign.dailyBudget || null,
      lifetime_budget: campaign.budget ?? 0,
      budget_remaining: null,
      network: 'unknown',
    };
  }

  toDomainEntity(dbObject) {
    return new Campaign(
      dbObject.name,
      dbObject.created_time,
      dbObject.updated_time,
      dbObject.id,
      dbObject.status,
      dbObject.user_id,
      dbObject.account_id,
      dbObject.ad_account_id,
      dbObject.daily_budget,
      dbObject.lifetime_budget,
      dbObject.budget_remaining,
    );
  }
}

module.exports = CampaignRepository;
