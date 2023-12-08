const _ = require("lodash");
const Campaign = require("../../../shared/entities/Campaign");
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");

class CampaignRepository {

  constructor(database) {
    this.tableName = "campaigns";
    this.database = database || new DatabaseRepository();
  }

  async saveOne(campaign,adAccountsMap) {
    const dbObject = this.toDatabaseDTO(campaign,adAccountsMap);
    return await this.database.insert(this.tableName, dbObject);
  }

  async updateOne(adset, criteria) {
    const dbObject = this.toDatabaseDTO(adset);
    return await this.database.update(this.tableName, dbObject, criteria);
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
      await this.database.upsert(this.tableName, chunk, "id");
    }
  }

  async update(updateFields, criterion) {
    return await this.database.update(this.tableName, updateFields, criterion);
  }

  async fetchCampaigns(fields = ["*"], filters = {}, limit, joins = []) {
    const results = await this.database.query(this.tableName, fields, filters, limit, joins);
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
    `)
    return results.rows;
  }

  async duplicateShallowCampaignOnDb(newCampaignId, entity_id, rename_options) {
    console.log(entity_id);
    // Fetch the existing campaign using the fetchCampaigns method
    const existingCampaigns = await this.fetchCampaigns(["*"], { id: entity_id });
    const existingCampaign = existingCampaigns[0];

    if (!existingCampaign) {
      throw new Error("Campaign not found");
    }

    let newName = existingCampaign.name;
    if (
      rename_options?.rename_strategy === "DEEP_RENAME" ||
      rename_options?.rename_strategy === "ONLY_TOP_LEVEL_RENAME"
    ) {
      if (rename_options.rename_prefix) {
        newName = `${rename_options.rename_prefix} ${newName}`;
      }
      if (rename_options.rename_suffix) {
        newName = `${newName} ${rename_options.rename_suffix}`;
      }
    }

    // Create a copy of the existing campaign, with some changes
    const newCampaign = {
      ...existingCampaign,
      id: newCampaignId, // Set the new ID
      name: newName,
    };

    // Convert the new campaign entity to a database DTO
    const newCampaignDbObject = this.toDatabaseDTO(newCampaign);

    // Insert the new campaign into the database using the saveOne method
    await this.saveOne(newCampaignDbObject);

    console.log(`successfully copied campaign on db with id: ${newCampaignId}`);
  }


  pickDefinedProperties(obj, keys, propertyMap) {
    return keys.reduce((acc, key, index) => {
      const mappedKey = propertyMap[index];
      if (obj[key] !== undefined) {
        acc[mappedKey] = obj[key];
      }
      return acc;
    }, {});
  }

  toDatabaseDTO(campaign, adAccountsMap) {
    const adAccountInfo = adAccountsMap?.[campaign.advertiser_id] || {};
    const dbObject = this.pickDefinedProperties(campaign, [
      "id",
      "name",
      "status",
      "daily_cap",
      "spending_limit",
      "start_date_in_utc",
      "end_date_in_utc",
      "user_id",
      "account_id",
      "ad_account_id",
    ], [
      "id",
      "name",
      "status",
      "daily_budget",
      "lifetime_budget",
      "created_time",
      "updated_time",
      "user_id",
      "account_id",
      "ad_account_id",
    ]);

    dbObject.network = "unkown";
    dbObject.traffic_source = "taboola";

    if (adAccountInfo.id !== undefined) {
      dbObject.ad_account_id = adAccountInfo.id;
    }

    if (adAccountInfo.user_id !== undefined) {
      dbObject.user_id = adAccountInfo.user_id;
    }

    if (adAccountInfo.account_id !== undefined) {
      dbObject.account_id = adAccountInfo.account_id;
    }

    return dbObject;
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
