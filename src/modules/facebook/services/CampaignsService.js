// Third party imports
const axios = require("axios");
const async = require("async");
const _ = require("lodash");

// Local application imports
const CampaignRepository = require("../repositories/CampaignRepository");
const { FacebookLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");
const { FB_API_URL } = require("../constants");
const { sendSlackNotification } = require("../../../shared/lib/SlackNotificationService");

class CampaignsService extends BaseService {
  constructor() {
    super(FacebookLogger);
    this.campaignRepository = new CampaignRepository();
  }

  async getCampaignsFromApi(access_token, adAccountIds, startDate, endDate, preset = null) {
    this.logger.info(`Fetching Campaigns from API`);
    const dateParam = preset ? { date_preset: preset } : { time_range: { since: startDate, until: endDate } };
    const fields =
      "id,account_id,budget_remaining,created_time, daily_budget, status,name,lifetime_budget,start_time,stop_time,updated_time";
    const effective_status = ["ACTIVE", "PAUSED"];
    const results = { sucess: [], error: [] };

    const allCampaigns = await async.mapLimit(adAccountIds, 100, async (adAccountId) => {
      let paging = {};
      const campaigns = [];
      let url = `${FB_API_URL}${adAccountId}/campaigns`;
      let params = {
        fields,
        ...dateParam,
        access_token,
        effective_status,
      };

      do {
        if (paging?.next) {
          url = paging.next;
          params = {};
        }

        const { data = [] } = await axios
          .get(url, {
            params,
          })
          .catch((err) => {
            results.error.push(adAccountId);
            return {};
          });
        results.sucess.push(adAccountId);
        paging = { ...data?.paging };
        if (data?.data?.length) campaigns.push(...data.data);
      } while (paging?.next);
      return campaigns;
    });

    if (results.sucess.length === 0) throw new Error("All ad accounts failed to fetch campaigns");
    this.logger.info(
      `Ad Accounts Campaign Fetching Telemetry: SUCCESS(${results.sucess.length}) | ERROR(${results.error.length})`,
    );
    return _.flatten(allCampaigns);
  }

  async syncCampaigns(access_token, adAccountIds, adAccountsMap, startDate, endDate, preset = null) {
    const campaigns = await this.getCampaignsFromApi(access_token, adAccountIds, startDate, endDate, (preset = null));
    this.logger.info(`Upserting ${campaigns.length} Campaigns`);
    await this.executeWithLogging(
      () => this.campaignRepository.upsert(campaigns, adAccountsMap, 500),
      "Error Upserting Campaigns",
    );
    this.logger.info(`Done upserting campaigns`);
    return campaigns.map((campaign) => campaign.id);
  }

  async updateCampaign(campaign, criteria) {
    try {
      return await this.campaignRepository.updateOne(campaign, criteria);
    } catch (error) {
      console.error("ERROR UPDATING campaign", error);
      await sendSlackNotification("ERROR UPDATING campaign. Inspect software if this is a error", error);
      throw error;
    }
  }

  async fetchUserAccountsEarliestCampaign(userAccountId) {
    const results = await this.campaignRepository.fetchAccountsEarliestCampaign(userAccountId);
    return results[0] ? results[0].date_in_utc : null;
  }

  async fetchCampaignsFromDatabase(fields = ["*"], filters = {}, limit, joins) {
    const results = await this.campaignRepository.fetchCampaigns(fields, filters, limit, joins);
    return results;
  }

  async fetchCampaignsFromClickhouse(campaign_id, startDate, endDate) {
    this.logger.info(`Fetching Facebook Campaigns from the Clickhouse database`);
    const results = await this.clickhouse.queryClickHouseCampaignsFacebook(campaign_id, startDate, endDate);
    this.logger.info(`Fetched ${results.length} Facebook Campaigns from the Clickhouse database`);
    return results;
  }

  async duplicateCampaign({ deep_copy, status_option, rename_options, entity_id, access_token }) {
    const url = `${FB_API_URL}${entity_id}/copies`;

    const data = {
      deep_copy: false,
      status_option,
      rename_options,
      access_token,
    };

    try {
      const response = await axios.post(url, data);

      // Normal copy of only the campaign and not of its children
      await this.campaignRepository.duplicateShallowCampaignOnDb(
        response.data?.ad_object_ids?.[0].copied_id,
        entity_id,
        rename_options,
      );

      //From our side just calling deep_copy is not possible will have to
      //manually get the adsets and call the endpoint for each of them
      if (deep_copy)
        await this.campaignRepository.duplicateDeepCopy(
          response.data?.ad_object_ids?.[0].copied_id,
          entity_id,
          rename_options,
          status_option,
          access_token,
        );
      return { successful: true };
    } catch ({ response }) {
      return false;
    }
  }

  async createCampaignInFacebook(access_token, adAccountId, campaignData) {
    const url = `${FB_API_URL}act_${adAccountId}/campaigns`;

    try {
      const response = await axios.post(url, null, {
        params: {
          access_token,
          ...campaignData,
        },
      });

      return response.data;
    } catch (err) {
      console.warn(err.response?.data ?? err);
      throw new Error("Failed to create campaign in Facebook");
    }
  }

  async createCampaign(access_token, adAccountId, campaignData, adAccountsDataMap) {
    try {
      // Extract vertical and category from campaignData
      const { vertical, category, ...facebookCampaignData } = campaignData;

      // Create campaign in Facebook without vertical and category
      const facebookResponse = await this.createCampaignInFacebook(access_token, adAccountId, facebookCampaignData);

      // Prepare the database object including vertical and category
      const dbObject = { ...facebookResponse, vertical, category, account_id: adAccountId, ...facebookCampaignData };

      // Save the campaign data to the local database
      await this.campaignRepository.saveOne(dbObject, adAccountsDataMap);

      return {
        success: true,
        message: "Campaign successfully created in Facebook and saved to the database.",
        data: facebookResponse,
      };
    } catch (err) {
      console.error("Error in createCampaign service method:", err.message);
      throw err; // Rethrow the error to maintain the stack trace
    }
  }


}

module.exports = CampaignsService;
