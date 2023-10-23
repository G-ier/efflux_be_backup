const { getTikTokEndpointData,updateTikTokEntity,statusMapping } = require("../helpers");
const { TIKTOK_ADSET_AVAILABLE_FIELDS } = require("../constants");
const AdsetsRepository = require("../repositories/AdsetsRepository");
const { TiktokLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");
const { sendSlackNotification }  = require("../../../shared/lib/SlackNotificationService");
const _ = require("lodash");

class AdsetService extends BaseService {

  constructor() {
    super(TiktokLogger);
    this.adsetsRepository = new AdsetsRepository();
  }

  async getTikTokAdsets(access_token, adAccountIds, date) {
    this.logger.info("Fetching Adsets from API");
    const endpoint = "adgroup";
    const additionalParams = {
      fields: JSON.stringify(TIKTOK_ADSET_AVAILABLE_FIELDS),
      creation_filter_start_time: date + " 00:00:00",
    };

    return await getTikTokEndpointData(endpoint, access_token, adAccountIds, additionalParams);
  }

  async syncAdsets(access_token, adAccountIds, adAccountsMap, campaignIds, date) {
    let adsets = await this.getTikTokAdsets(access_token, adAccountIds, date);
    adsets = adsets.filter((adset) => campaignIds.includes(adset.campaign_id));
    this.logger.info(`Upserting ${adsets.length} Adsets`);
    await this.adsetsRepository.upsert(adsets, adAccountsMap, 500);
    this.logger.info(`Done upserting adsets`);
    return adsets.map((adset) => adset.adgroup_id);
  }

  async updateEntity({entityId, dailyBudget, status, advertiser_id, token}) {
    try {
      this.logger.info(`Starting update for entity ID: ${entityId}`);  // Log the start of the update operation
      // Dynamically construct criteria based on provided values
      const criteria = {};
      if (dailyBudget !== undefined) {
        criteria.dailyBudget = dailyBudget/100;
        criteria.budget = dailyBudget/100;
      }
      if (status !== undefined) {
        criteria.status = statusMapping[status];
      }
      this.logger.debug(`Update criteria for entity ID ${entityId}: ${JSON.stringify(criteria)}`);  // Log the update criteria
      // Ensure at least one criterion has been provided
      if (Object.keys(criteria).length === 0) {
        this.logger.error('No update criteria provided');  // Log an error if no criteria are provided
        throw new Error('No update criteria provided');
      }
      // Call updateTikTokEntity with the necessary arguments
      this.logger.info(`Updating TikTok entity for ID ${entityId}`);  // Log the start of the TikTok update
      const tikTokResponse = await updateTikTokEntity({
        advertiser_id,
        type: 'adset',
        access_token: token,
        updateParams: criteria,
        entityId
      });

      this.logger.info(`Successfully updated TikTok entity for ID ${entityId}`);  // Log the success of the TikTok update

      // After successfully updating the TikTok entity, update the local entity in your database
      this.logger.info(`Updating local entity for ID ${entityId}`);  // Log the start of the local update
      const localUpdateResponse = await this.adsetsRepository.updateOne(criteria, { provider_id: entityId });

      this.logger.info(`Successfully updated local entity for ID ${entityId}`);  // Log the success of the local update
      return {
        tikTokResponse,
        localUpdateResponse
      };
    } catch (error) {
      this.logger.error(`ERROR UPDATING ENTITY ID ${entityId}`, error);  // Utilizing the logger with more context
      await sendSlackNotification("ERROR UPDATING ENTITY. Inspect software if this is an error", error);  // Sending a Slack notification
      throw error;
    }
  }

  async updateAdsetsForCampaign(campaignId, status, token,advertiser_id) {
    try {
        this.logger.info(`Fetching adsets for campaign ID ${campaignId}`);
        const adsets = await this.fetchAdsetsFromDatabase(["provider_id", "ad_account_id"], {campaign_id: campaignId});

        if (adsets.length === 0) {
            this.logger.warn(`No adsets found for campaign ID ${campaignId}`);
            return;
        }

        const adsetEntityIds = adsets.map(adset => adset.provider_id);
        this.logger.info(`Updating status for adset IDs ${adsetEntityIds.join(', ')} to ${status}`);

        const updateResponse = await this.updateEntity({
            entityId: adsetEntityIds,
            status,
            advertiser_id,
            token
        });

        // Optional: Check updateResponse for success/failure and log accordingly
        if (updateResponse && updateResponse.tikTokResponse.statusResponse.code === 0) {
            this.logger.info(`Successfully updated status for adset IDs ${adsetEntityIds.join(', ')} to ${status}`);
        } else {
            this.logger.error(`Failed to update status for adset IDs ${adsetEntityIds.join(', ')}. Error Code: ${updateResponse.code}`);
        }

    } catch (error) {
        this.logger.error(`Error updating adsets for campaign ID ${campaignId}: ${error.message}`);
        throw error;
    }
  }

  async fetchAdsetsFromDatabase(fields = ["*"], filters = {}, limit) {
    return await this.adsetsRepository.fetchAdsets(fields, filters, limit);
  }

}

module.exports = AdsetService;
