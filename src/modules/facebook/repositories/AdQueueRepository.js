const _ = require("lodash");
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");
const AdQueue = require("../entities/AdQueue"); // Assuming you have a corresponding entity for AdQueue

class AdQueueRepository {
  constructor(database) {
    this.tableName = "ad_queue";
    this.database = database || new DatabaseRepository();
  }

  toDatabaseDTO(adQueue) {
    return {
      // Existing fields
      ad_account_id: adQueue.ad_account_id,

      // Fields from campaignData
      campaign_name: adQueue.campaign_name,
      campaign_objective: adQueue.campaign_objective,
      campaign_special_ad_categories: JSON.stringify(adQueue.campaign_special_ad_categories),
      campaign_special_ad_categorie_country: adQueue.campaign_special_ad_categorie_country,

      // Fields from adsetData
      adset_name: adQueue.adset_name,
      adset_status: adQueue.adset_status,
      adset_daily_budget: adQueue.adset_daily_budget,
      adset_special_ad_categories: JSON.stringify(adQueue.adset_special_ad_categories),
      adset_special_ad_categorie_country: adQueue.adset_special_ad_categorie_country,
      dsa_beneficiary: adQueue.dsa_beneficiary,
      dsa_payor: adQueue.dsa_payor,
      adset_optimization_goal: adQueue.adset_optimization_goal,
      adset_billing_event: adQueue.adset_billing_event,
      is_dynamic_creative: adQueue.is_dynamic_creative,
      promoted_object: JSON.stringify(adQueue.promoted_object),
      adset_targeting: JSON.stringify(adQueue.adset_targeting),
      attribution_spec: JSON.stringify(adQueue.attribution_spec),

      // Fields from adData
      ad_name: adQueue.ad_name,
      ad_status: adQueue.ad_status,
      creative_name: adQueue.creative_name,
      asset_feed_spec: JSON.stringify(adQueue.asset_feed_spec),

      // Other fields
      created_at: adQueue.created_at,
      updated_at: adQueue.updated_at,
    };
  }
  // Convert database object to AdQueue domain entity
  toDomainEntity(dbObject) {
    return new AdQueue(
      dbObject
    );
  }

  async saveOne(adQueue, contentIds = []) {
    const dbObject = this.toDatabaseDTO(adQueue);
    console.log({dbObject})
    try {
      // Start a transaction
      const trx = await this.database.startTransaction();
      try {
        // Insert the AdQueue entry
        const insertedAdQueues = await trx(this.tableName).insert(dbObject).returning('*')
        console.log({insertedAdQueues})
        const adQueueId = insertedAdQueues[0].id;

        // Insert into the junction table for each contentId
        if (contentIds && contentIds.length > 0) {
          const junctionEntries = contentIds.map((contentId) => ({
            ad_queue_id: adQueueId,
            content_id: contentId,
          }));
          await trx("ad_queue_content").insert(junctionEntries);
        }

        // Commit the transaction
        await trx.commit();

        return adQueueId;
      } catch (error) {
        // Rollback in case of an error
        await trx.rollback();
        throw error;
      }
    } catch (error) {
      console.error(`Error in transaction when saving AdQueue: ${error.message}`);
      throw error;
    }
  }

  async saveInBulk(adQueues, chunkSize = 500) {
    let data = adQueues.map((adQueue) => this.toDatabaseDTO(adQueue));
    let dataChunks = _.chunk(data, chunkSize);
    for (let chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk);
    }
  }

  async updateOne(adQueue, criteria) {
    const data = this.toDatabaseDTO(adQueue);
    const dbObject = Object.keys(data).reduce((acc, key) => {
      if (data[key] != null) {
        acc[key] = data[key];
      }
      return acc;
    }, {});
    return await this.database.update(this.tableName, dbObject, criteria);
  }

  async fetchAdQueues(fields = ["*"], filters = {}, limit) {
    try {
      let baseQuery = `
      SELECT 
          ad_queue.*,
          json_agg(content.*) as contents
      FROM 
          ad_queue
      LEFT JOIN 
          ad_queue_content ON ad_queue.id = ad_queue_content.ad_queue_id
      LEFT JOIN 
          content ON ad_queue_content.content_id = content.id
      GROUP BY 
          ad_queue.id
  `;
      // Apply filters
      let whereClauses = [];
      for (const [key, value] of Object.entries(filters)) {
        if (Array.isArray(value)) {
          whereClauses.push(`"${this.tableName}".${key} IN (${value.join(", ")})`);
        } else {
          whereClauses.push(`"${this.tableName}".${key} = '${value}'`);
        }
      }
      if (whereClauses.length > 0) {
        baseQuery += ` WHERE ${whereClauses.join(" AND ")}`;
      }

      // Apply limit
      if (limit) {
        baseQuery += ` LIMIT ${limit}`;
      }

      const results = await this.database.connection.raw(baseQuery);
      return results.rows.map((result) => {
        // Convert to domain entity and include contents
        const adQueue = this.toDomainEntity(result);
        console.log({adQueue})
        adQueue.contents = result.contents; // Adjust based on your actual result field names
        return adQueue;
      });
    } catch (error) {
      console.error(`Error executing raw query for table ${this.tableName}:`, error);
      throw error;
    }
  }
}

module.exports = AdQueueRepository;
