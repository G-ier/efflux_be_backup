const _ = require('lodash');
const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');
const AdQueue = require('../entities/AdQueue'); // Assuming you have a corresponding entity for AdQueue
const AdMetaDataRepository = require('./AdMetaDataRepository');
const CampaignMetaDataRepository = require('./CampaignMetaDataRepository');
const AdsetMetadataRepository = require('./AdsetMetaDataRepository');

class AdQueueRepository {
  constructor(database) {
    this.tableName = 'ad_launcher_queue';
    this.database = database || new DatabaseRepository();
    this.adMetadataRepository = new AdMetaDataRepository();
    this.adsetMetadataRepository = new AdsetMetadataRepository();
    this.campaignMetadataRepository = new CampaignMetaDataRepository();
  }

  // Convert database object to AdQueue domain entity
  toDomainEntity(dbObject) {
    return new AdQueue(dbObject);
  }
  async saveOne({ data, adAccountId, campaignId, adsetId, adId, existingMedia }) {
    try {
      // Parse the JSON data
      const campaignData = data.campaignData ? JSON.parse(data.campaignData) : null;
      const adsetData = data.adsetData ? JSON.parse(data.adsetData) : null;
      const adData = data.adData ? JSON.parse(data.adData) : null;
      console.log('Starting transaction');
      const trx = await this.database.startTransaction();

      try {
        let campaignMetadataId, adsetMetadataId, adMetadataId;

        if (campaignData) {
          console.log('Handling campaign data');
          const campaignDbObject = this.campaignMetadataRepository.toDatabaseDTO({
            ...campaignData,
            campaign_id: campaignId,
          });
          [campaignMetadataId] = await trx(this.campaignMetadataRepository.tableName)
            .insert(campaignDbObject)
            .returning('id');
          console.log('Campaign data inserted with ID:', campaignMetadataId);
        }

        if (adsetData) {
          console.log('Handling adset data');
          const adsetDbObject = this.adsetMetadataRepository.toDatabaseDTO({
            ...adsetData,
            adset_id: adsetId,
          });
          [adsetMetadataId] = await trx(this.adsetMetadataRepository.tableName)
            .insert(adsetDbObject)
            .returning('id');
          console.log('Adset data inserted with ID:', adsetMetadataId);
        }

        if (adData) {
          console.log('Handling ad data');
          const adDbObject = this.adMetadataRepository.toDatabaseDTO({ ...adData, ad_id: adId });
          [adMetadataId] = await trx(this.adMetadataRepository.tableName)
            .insert(adDbObject)
            .returning('id');
          console.log('Ad data inserted with ID:', adMetadataId);
        }

        console.log('Inserting into ad_launcher_queue');
        const [adLauncherQueueId] = await trx(this.tableName)
          .insert({
            traffic_source: 'facebook',
            ad_account_id: adAccountId,
            campaign_metadata_id: campaignMetadataId,
            ad_metadata_id: adMetadataId,
            adset_metadata_id: adsetMetadataId,
          })
          .returning('id');
        console.log('Inserted into ad_launcher_queue with ID:', adLauncherQueueId);

        const mediaIds = existingMedia?.map((media) => media.id);
        if (mediaIds && mediaIds.length > 0) {
          console.log('Handling media data');
          const mediaQueueLinks = mediaIds.map((mediaId) => ({
            media_id: mediaId,
            ad_launcher_queue_id: adLauncherQueueId,
          }));

          await trx('ad_media_queue_link').insert(mediaQueueLinks);
          console.log('Media data linked');
        }

        console.log('Committing transaction');
        await trx.commit();
        console.log('Transaction committed successfully');
      } catch (error) {
        console.error('Error during transaction, rolling back', error);
        await trx.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error starting transaction', error);
      throw error;
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

  async fetchAdQueues(fields = ['*'], filters = {}, limit) {
    try {
        let baseQuery = `
            SELECT
                ad_launcher_queue.*,
                row_to_json(campaign_metadata.*) as "campaignData",
                row_to_json(ad_metadata.*) as "adData",
                row_to_json(adset_metadata.*) as "adsetData",
                json_agg(ad_launcher_media.*) as media_contents
            FROM
                ad_launcher_queue
            LEFT JOIN
                campaign_metadata ON ad_launcher_queue.campaign_metadata_id = campaign_metadata.id
            LEFT JOIN
                ad_metadata ON ad_launcher_queue.ad_metadata_id = ad_metadata.id
            LEFT JOIN
                adset_metadata ON ad_launcher_queue.adset_metadata_id = adset_metadata.id
            LEFT JOIN
                ad_media_queue_link ON ad_launcher_queue.id = ad_media_queue_link.ad_launcher_queue_id
            LEFT JOIN
                ad_launcher_media ON ad_media_queue_link.media_id = ad_launcher_media.id`;

        let queryParams = [];
        let whereClauses = [];
        for (const [key, value] of Object.entries(filters)) {
            if (Array.isArray(value)) {
                whereClauses.push(`"${this.tableName}".${key} IN (${value.map(() => `?`).join(', ')})`);
                queryParams.push(...value);
            } else {
                whereClauses.push(`"${this.tableName}".${key} = ?`);
                queryParams.push(value);
            }
        }

        if (whereClauses.length > 0) {
            baseQuery += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        baseQuery += ` GROUP BY ad_launcher_queue.id, campaign_metadata.id, ad_metadata.id, adset_metadata.id`;

        if (limit) {
            baseQuery += ` LIMIT ?`;
            queryParams.push(limit);
        }

        console.log(baseQuery);
        
        const results = await this.database.connection.raw(baseQuery, queryParams);
        return results.rows.map((result) => {
            // Convert to domain entity and include contents
            // const adQueue = this.toDomainEntity(result);
            const adQueue = result;
            // adQueue.contents = result.contents; // Adjust based on your actual result field names
            return adQueue;
        });
    } catch (error) {
        console.error(`Error executing raw query for table ${this.tableName}:`, error);
        throw error;
    }
}

}  

module.exports = AdQueueRepository;
