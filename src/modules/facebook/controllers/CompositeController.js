const CompositeService = require("../services/CompositeService");
const AggregatesService = require("../../aggregates/services/AggregatesService");

class CompositeController {

  constructor() {
    this.compositeService = new CompositeService();
  }

  async updateFacebookData(req, res) {
    const { startDate, endDate } = req.query;
    const updateResult = await this.compositeService.updateFacebookData(startDate, endDate, {
      updatePixels: true,
      updateCampaigns: true,
      updateAdsets: true,
      updateInsights: true
    });

    if (updateResult) res.status(200).send("Facebook data updated");
    else res.status(500).send("The server failed to update facebook data");
  }

  async syncAccountData(req, res) {

    const { userAccountId } = req.query;

    // 1. Get the data of the user account
    const accounts = await this.compositeService.userAccountService.fetchUserAccountById(userAccountId, ['token', 'name', 'user_id', 'provider_id', 'id'])
    if (!accounts.length) res.status(200).send("No entity was found for the user")
    const account = accounts[0];

    // 2. Sync the facebook data of the account without insights
    const today= new Date().toISOString().split('T')[0]
    const syncEntityResult = await this.compositeService.syncUserAccountsData(account, today, today, {
      updatePixels: true,
      updateCampaigns: true,
      updateAdsets: true,
      updateInsights: false,
    })
    if (!syncEntityResult) res.status(500).send("The server failed to sync facebook data")

    // 3. Fetch campaigns earliest start_time
    const startTime = await this.compositeService.campaignsService.fetchUserAccountsEarliestCampaign(userAccountId)
    if (startTime === null) res.status(200).send("No entity was found for the user")

    // 4. Sync the facebook data of the account with insights
    const syncInsightsResult = await this.compositeService.syncUserAccountsData(account, startTime, today, {
      updatePixels: false,
      updateCampaigns: false,
      updateAdsets: false,
      updateInsights: true,
    })
    if (!syncInsightsResult) res.status(500).send("The server failed to sync facebook data")

    // 5. Fetch all campaign ids of the user account
    const campaignIds = await this.compositeService.campaignsService.fetchCampaignsFromDatabase(['id'], { account_id: userAccountId })
    const ids = campaignIds.map(({ id }) => id);
    const campaignIdsRestriction = `(${ids.map((id) => `'${id}'`).join(',')})`

    // 6. Sync aggregates
    await new AggregatesService().updateFacebookUserAccountAggregates(startTime, today, campaignIdsRestriction)

    res.status(200).send("Facebook data synced")
  };

  async updateEntity(req, res) {
    const { entityId, status, dailyBudget, type } = req.query;
    try {
      const updated = await this.compositeService.updateEntity({ type, entityId, status, dailyBudget });
      res.status(200).json({ updated });
    } catch ({ message }) {
      res.status(500).json({ message });
    }
  }

  async duplicateEntity(req, res) {
    const { type, deep_copy, status_option, rename_options, entity_id } = req.body;
    try {
      const response = await this.compositeService.duplicateEntity({
        type,
        deep_copy,
        status_option,
        rename_options,
        entity_id,
      });

      res.status(200).json(response);
    } catch ({ message }) {
      res.status(500).json({ message });
    }
  }
}

module.exports = CompositeController;
