const _ = require('lodash');
const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');
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

  async saveOne({
    data,
    adAccountId,
    campaignId,
    adsetId,
    adId,
    existingMedia,
    existingLaunchId,
    status,
    existingContentIds,
  }) {
    try {
      const trx = await this.database.startTransaction();
      try {
        const { campaignMetadataId, adsetMetadataId, adMetadataId } =
          await this.handleUpsertOperations({
            data,
            campaignId,
            adsetId,
            adId,
            existingLaunchId,
            trx,
          });

        const adLauncherQueueId = await this.insertOrUpdateAdLauncherQueue({
          adAccountId,
          campaignMetadataId,
          adMetadataId,
          adsetMetadataId,
          status,
          trx,
          existingLaunchId,
        });

        await this.handleMediaData(existingMedia, existingContentIds, adLauncherQueueId, trx);

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

  async handleUpsertOperations({ data, campaignId, adsetId, adId, existingLaunchId, trx }) {
    const campaignData = data.campaignData ? JSON.parse(data.campaignData) : null;
    const adsetData = data.adsetData ? JSON.parse(data.adsetData) : null;
    const adData = data.adData ? JSON.parse(data.adData) : null;

    let { campaignMetadataId, adsetMetadataId, adMetadataId } = await this.fetchExistingIds(
      existingLaunchId,
      trx,
    );

    campaignMetadataId = await this.campaignMetadataRepository.upsert(
      campaignData,
      campaignId,
      campaignMetadataId,
      trx,
    );
    adsetMetadataId = await this.adsetMetadataRepository.upsert(
      adsetData,
      adsetId,
      adsetMetadataId,
      trx,
    );
    adMetadataId = await this.adMetadataRepository.upsert(adData, adId, adMetadataId, trx);

    return { campaignMetadataId, adsetMetadataId, adMetadataId };
  }

  async fetchExistingIds(existingLaunchId, trx) {
    if (!existingLaunchId) {
      return {};
    }
    const existingRecords = await trx(this.tableName).where({ id: existingLaunchId }).first();
    return {
      campaignMetadataId: existingRecords?.campaign_metadata_id,
      adsetMetadataId: existingRecords?.adset_metadata_id,
      adMetadataId: existingRecords?.ad_metadata_id,
    };
  }

  async insertOrUpdateAdLauncherQueue({
    existingLaunchId,
    adAccountId,
    campaignMetadataId,
    adMetadataId,
    adsetMetadataId,
    status,
    trx,
  }) {
    if (existingLaunchId) {
      // If existingLaunchId is provided, update the status of the existing record
      await trx(this.tableName).where('id', existingLaunchId).update({
        status: 'launched', // Assuming you want to set the status to 'launched'
      });
      return existingLaunchId;
    } else {
      // If existingLaunchId is not provided, insert a new record
      const [adLauncherQueueId] = await trx(this.tableName)
        .insert({
          traffic_source: 'facebook',
          ad_account_id: adAccountId,
          campaign_metadata_id: campaignMetadataId,
          ad_metadata_id: adMetadataId,
          adset_metadata_id: adsetMetadataId,
          status: status,
        })
        .returning('id');
      return adLauncherQueueId;
    }
  }

  async handleMediaData(existingMedia, existingContentIds, adLauncherQueueId, trx) {
    if (
      (!existingMedia || existingMedia.length === 0) &&
      (!existingContentIds || existingContentIds.length === 0)
    ) {
      return;
    }

    // First, remove old media connections for the adLauncherQueueId
    await trx('ad_media_queue_link').where('ad_launcher_queue_id', adLauncherQueueId).delete();
    console.log('Old media connections removed for ad_launcher_queue_id:', adLauncherQueueId);
    // Filter out undefined values and then map existingMedia
    const mediaQueueLinksFromExistingMedia = existingMedia
      .filter((media) => media !== undefined && media.id !== undefined)
      .map((media) => ({
        media_id: media.id,
        ad_launcher_queue_id: adLauncherQueueId,
      }));

    // Filter out undefined values and then map existingContentIds
    const mediaQueueLinksFromContentIds = existingContentIds
      .filter((id) => id !== undefined)
      .map((id) => ({
        media_id: id,
        ad_launcher_queue_id: adLauncherQueueId,
      }));
    // Combine the two arrays
    const mediaQueueLinks = mediaQueueLinksFromExistingMedia.concat(mediaQueueLinksFromContentIds);

    // Insert new media connections
    await trx('ad_media_queue_link').insert(mediaQueueLinks);
    console.log('New media data linked for ad_launcher_queue_id:', adLauncherQueueId);
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

      const results = await this.database.connection.raw(baseQuery, queryParams);
      return results.rows.map((result) => {
        // Convert to domain entity and include contents
        // const adQueue = this.toDomainEntity(result);
        const adQueue = result;
        // adQueue.contents = result.contents; // Adjust based on your actual result field names
        return adQueue;
      });
    } catch (error) {
      console.error(`❌ Error executing raw query for table ${this.tableName}:`, error);
      throw error;
    }
  }
}

module.exports = AdQueueRepository;
