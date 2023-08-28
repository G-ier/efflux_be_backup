// Third party imports
const axios = require("axios");
const async = require("async");
const _ = require("lodash");

// Local application imports
const CampaignRepository = require('../repositories/CampaignRepository');
const { FB_API_URL } = require('../constants');

class CampaignsService {

  constructor() {
    this.campaignRepository = new CampaignRepository();
  }

  async getCampaignsFromApi(access_token, adAccountIds,  date = "today") {
    const isPreset = !/\d{4}-\d{2}-\d{2}/.test(date);
    const dateParam = isPreset ? { date_preset: date } : { time_range: { since: date, until: date } };

    const fields =
      "id,account_id,budget_remaining,created_time, daily_budget, status,name,lifetime_budget,start_time,stop_time,updated_time";
    const effective_status = ["ACTIVE", "PAUSED"];

    const allCampaigns = await async.mapLimit(adAccountIds, 100, async (adAccountId) => {
      const url = `${FB_API_URL}${adAccountId}/campaigns`;
      const response = await axios
        .get(url, {
          params: {
            fields,
            ...dateParam,
            access_token,
            effective_status,
          },
        })
        .catch((err) => console.warn(err.response?.data ?? err));
      return response?.data?.data || [];
    });

    return _.flatten(allCampaigns);
  }

  async syncCampaigns(access_token, adAccountIds, adAccountsMap, date = "today") {
    const campaigns = await this.getCampaignsFromApi(access_token, adAccountIds, date);
    await this.campaignRepository.upsert(campaigns, adAccountsMap, 500);
    return campaigns.map((campaign) => campaign.id);
  }

  async fetchCampaignsFromDatabase(fields = ['*'], filters = {}, limit) {
    const results = await this.campaignRepository.fetchCampaigns(fields, filters, limit);
    return results;
  }

}

module.exports = CampaignsService;
