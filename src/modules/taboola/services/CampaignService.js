// Third party imports
const axios = require("axios");
const async = require("async");

// Local application imports
const { TaboolaLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");
const _ = require("lodash");
const { TABOOLA_URL } = require("../constants");
const { sendSlackNotification } = require("../../../shared/lib/SlackNotificationService");
const CampaignRepository = require("../repositories/CampaignRepository");

class CampaignService extends BaseService {

  constructor() {
    super(TaboolaLogger);
    this.campaignRepository = new CampaignRepository();
  }

  async getCampaignsFromApi(access_token, adAccountIds, fetch_level="R") {
      this.logger.info(`Fetching Campaigns from API`);
      const results = { sucess: [], error: [] };
      const headers = {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      }
      const allCampaigns = await async.mapLimit(adAccountIds, 100, async (adAccountId) => {
        let paging = {};
        const campaigns = [];
        let url = `${TABOOLA_URL}/api/1.0/${adAccountId}/campaigns/`;
        let params = {
          access_token,
          // fetch_level: fetch_level
        };

        do {
          if (paging?.next) {
            url = paging.next;
            params = {};
          }
          const { data = [] } = await axios
            .get(url, {
              params,
              headers,
            }, )
            .catch((err) => {
              results.error.push(adAccountId);
              return {};
            });
          results.sucess.push(adAccountId);
          paging = { ...data?.paging };
          if (data?.results?.length) campaigns.push(...data.results);
        } while (paging?.next);
        return campaigns;
      });
      if (results.sucess.length === 0) throw new Error("All ad accounts failed to fetch campaigns");
      this.logger.info(
        `Ad Accounts Campaign Fetching Telemetry: SUCCESS(${results.sucess.length}) | ERROR(${results.error.length})`,
      );
      return _.flatten(allCampaigns);
  }

  async syncCampaigns(access_token, adAccountIds, adAccountsMap) {
    const campaigns = await this.getCampaignsFromApi(access_token, adAccountIds);
    this.logger.info(`Upserting ${campaigns.length} Campaigns`);
    await this.executeWithLogging(
      () => this.campaignRepository.upsert(campaigns, adAccountsMap, 500),
      "Error Upserting Campaigns",
    );
    this.logger.info(`Done upserting campaigns`);
    const result = campaigns.map(campaign => {
      const adAccount = adAccountsMap[campaign.advertiser_id];
        return {
          campaignId: campaign.id,
          adAccountId: adAccount.account_id,
          providerId: campaign.advertiser_id // Replace 'additionalField' with the actual field you want to add
        };
    });
    return result;
  }

  async filterCampaignProperties(campaigns){
    const fields =
    "id,account_id,budget_remaining,created_time, daily_cap,\
    status,name,spending_limit, bid_Strategy,start_date,end_date, spent,updated_time";
    let selectedPropertiesList = listOfObjects.map(obj => {
      const selectedObject = {};
      fields.split(',').forEach(field => {
        selectedObject[field.trim()] = obj[field.trim()];
      });
      return selectedObject;
    });

  }
}

module.exports = CampaignService;
