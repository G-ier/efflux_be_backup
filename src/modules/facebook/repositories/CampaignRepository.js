const _ = require("lodash");
const Campaign = require("../entities/Campaign");
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");
const AdsetService = require("../services/AdsetsService");
const AdsetRepository = require("./AdsetsRepository");
class CampaignRepository {

  constructor(database) {
    this.tableName = "campaigns";
    this.database = database || new DatabaseRepository();
    this.adsetService = new AdsetService();
    this.adsetRepository = new AdsetRepository();
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
        TO_CHAR((c.created_time::timestamptz AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') AS date_in_utc
    FROM
        campaigns c
    INNER JOIN
      ad_accounts aa ON aa.id = c.ad_account_id
    INNER JOIN
      ua_aa_map map ON map.aa_id = aa.id
    WHERE
        map.ua_id = ${userAccountId}
    ORDER BY
        c.created_time::timestamptz
    LIMIT 1;
    `)
    return results.rows;
  }

  async duplicateShallowCampaignOnDb(newCampaignId, entity_id, rename_options) {
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

  async duplicateDeepCopy(newCampaignId, entity_id, rename_options, status_option, access_token) {
    // Fetch the existing campaign using the fetchCampaigns method
    const existingCampaigns = await this.fetchCampaigns(["*"], { id: entity_id });
    const existingCampaign = existingCampaigns[0];

    if (!existingCampaign) {
      throw new Error("Campaign not found");
    }

    // Query the existing adsets with the provided ID
    // Assuming adsets is another table and its corresponding repository has a fetchAdsets method
    let existingAdsets = await this.adsetRepository.fetchAdsets(["*"], { campaign_id: entity_id });

    // Iterate through the adsets and make necessary changes
    const newAdsets = existingAdsets.map(async (adset) => {

      await this.adsetService.duplicateAdset({
        deep_copy: false,
        status_option,
        rename_options: {
          ...rename_options,
          rename_strategy: rename_options?.deep_copy === "DEEP_RENAME" ? "DEEP_RENAME" : "NO_RENAME",
        },
        entity_id: adset.provider_id,
        access_token,
        campaign_id: newCampaignId,
      });
    });

    await Promise.all(newAdsets);
  }

  pickDefinedProperties(obj, keys) {
    return keys.reduce((acc, key) => {
      if (obj[key] !== undefined) {
        acc[key] = obj[key];
      }
      return acc;
    }, {});
  }

  toDatabaseDTO(campaign, adAccountsMap) {
    const adAccountInfo = adAccountsMap?.[campaign.account_id] || {};

    const dbObject = this.pickDefinedProperties(campaign, [
      "id",
      "name",
      "status",
      "daily_budget",
      "lifetime_budget",
      "created_time",
      "budget_remaining",
      "updated_time",
      "ad_account_id",
      'vertical',
      'category'
    ]);

    dbObject.network = "unkown";
    dbObject.traffic_source = "facebook";

    if (adAccountInfo.id !== undefined) {
      dbObject.ad_account_id = adAccountInfo.id;
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
