const AggregatesService = require("../../aggregates/services/AggregatesService");
const CompositeService = require("../services/CompositeService");

class CompositeController {

  constructor() {
    this.service = new CompositeService();
  }

  async updateData(req, res) {
    let { date, endDate, adAccountIdsLimitation, uPixels, uCampaigns, uAdsets, uAds, uInsights } = req.query;
    uPixels = uPixels === "true";
    uCampaigns = uCampaigns === "true";
    uAdsets = uAdsets === "true";
    uAds = uAds === "true";
    uInsights = uInsights === "true";
    try {
      if (adAccountIdsLimitation) {
        adAccountIdsLimitation = JSON.parse(adAccountIdsLimitation);
      }
      await this.service.updateTikTokData(date, endDate, adAccountIdsLimitation, uPixels, uCampaigns, uAdsets, uAds, uInsights);
      res.status(200).json({ message: "TikTok data updated successfully." });
    } catch (error) {
      console.error("Error updating TikTok data in controller: ", error);
      res.status(500).json({ message: "Error updating TikTok data.", error: error.message });
    }

  }

  async updateEntity(req, res) {
    const { entityId, status, dailyBudget, type } = req.query;
    try {
      const updated = await this.service.updateEntity({ type, entityId, status, dailyBudget });

      res.status(200).json({ updated });
    } catch ({ message }) {
      res.status(500).json({ updated: false, message });
    }
  }

  async syncAccountData(req, res) {

    const { userAccountId } = req.query;

    // 1. Get the data of the user account
    const accounts = await this.service.userAccountsService.fetchUserAccountById(userAccountId, [
      "token",
      "name",
      "user_id",
      "provider_id",
      "id",
    ]);
    if (!accounts.length) res.status(200).send("No entity was found for the user");
    const account = accounts[0];

    // // 2. Sync the Tiktok data of the account without insights
    const today = new Date().toISOString().split("T")[0];
    const syncEntityResult = await this.service.syncUserAccountData(account, today, null, null, true, true, true, true, false);
    if (!syncEntityResult) {
      res.status(500).send("The server failed to sync Tiktok data")
      return
    }

    // 3. Fetch campaigns earliest start_time
    const startTime = await this.service.campaignService.fetchUserAccountsEarliestCampaign(userAccountId);
    if (startTime === null) {
      res.status(500).send("No entity was found for the user");
      return
    }

    const syncInsightsResult = await this.service.syncUserAccountData(account, startTime, today, null, false, false, false, false, true);
    if (!syncInsightsResult) {
      res.status(500).send("The server failed to sync Tiktok data")
      return
    }

    // 5. Fetch all campaign ids of the user account
    const campaignIds = await this.service.campaignService.fetchCampaignsFromDatabase(["id"], {
      account_id: userAccountId,
    });
    const ids = campaignIds.map(({ id }) => id);
    const campaignIdsRestriction = `(${ids.map((id) => `'${id}'`).join(",")})`;

    // 6. Sync aggregates
    await new AggregatesService().updateTikTokUserAccountAggregates(startTime, today, campaignIdsRestriction);

    res.status(200).send("Syncing data for user account " + account.name + "from date " + startTime + " to today");
  }

}

module.exports = CompositeController;
