const AggregatesService = require('../services/AggregatesService');
const EnvironmentVariablesManager = require('../../../shared/services/EnvironmentVariablesManager');

class AggregatesController {

  constructor() {
    this.aggregatesService = new AggregatesService();
  }

  async extractRequestDataWithUser(req) {
    try {
      const user = req.user;
      let { mediaBuyer, ...otherParams } = req.query;

      console.log({
        "log": "extracting request data with user",
        "mediaBuyer": mediaBuyer
      })

      if (EnvironmentVariablesManager.getEnvVariable('DISABLE_AUTH_DEADLOCK') !== 'true') {

        if (!user) {
          throw new Error('User information not available in the request');
        }

        // Check if the user has 'admin' permission
        const isAdmin = user.isAdmin;

        console.log({
          "log": "checking if user is admin",
          "isAdmin": isAdmin
        })

        // If the user is not an admin, enforce mediaBuyer to be the user's ID
        if (!isAdmin) {
          mediaBuyer = user.id; // Assuming 'id' is the user's identifier
          if (!mediaBuyer) {
            throw new Error('User cannot be identified');
          }
        } else {
          if (mediaBuyer && mediaBuyer === 3) {
            mediaBuyer = undefined;
          }
        }

        console.log({
          "log": "defined mediaBuyer",
          "mediaBuyer": mediaBuyer
        })

      }
      return { ...otherParams, mediaBuyer, user };
    } catch (e) {
      console.error('Error in extracting user:', e);
      throw e;
    }
  }

  async generateCampaignAdsetsReport(req, res) {
    try {
      const { startDate, endDate, campaignId } = await this.extractRequestDataWithUser(req);
      const user = req.user;
      const orgId = user?.org_id || 1; // 1 is for default org
      const data = await this.aggregatesService.generateCampaignAdsetsReport(
        startDate,
        endDate,
        campaignId,
        // orgId,
      );
      return res.json(data);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: e.message });
    }
  }

  async generateCampaignDailyReport(req, res) {
    try {
      const { startDate, endDate, campaignId } = await this.extractRequestDataWithUser(req);
      const data = await this.aggregatesService.generateCampaignDailyReport(
        startDate,
        endDate,
        campaignId
      );
      return res.json(data);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: e.message });
    }
  }

  async generateCampaignHourlyReport(req, res) {
    try {
      const { startDate, endDate, campaignId } = await this.extractRequestDataWithUser(req);
      const user = req.user;
      const orgId = user?.org_id || 1; // 1 is for default org
      const data = await this.aggregatesService.generateCampaignHourlyReport(
        startDate,
        endDate,
        campaignId,
        // orgId,
      );
      return res.json(data);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: e.message });
    }
  }

  async generateTrafficSourceNetworkCampaignsAdsetsStatsReport(req, res) {

    try {
      const { trafficSource, network, startDate, endDate, mediaBuyer, adAccountId } = await this.extractRequestDataWithUser(req);
      const data =
        await this.aggregatesService.generateTrafficSourceNetworkCampaignsAdsetsStatsReport(
          startDate,
          endDate,
          network,
          trafficSource,
          mediaBuyer,
          adAccountId
        );
      return res.json(data);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: e.message });
    }
  }

  async generateTrafficSourceNetworkCampaignsStatsReport(req, res) {
    try {
      const { trafficSource, network, startDate, endDate, mediaBuyer, adAccountId, q } =
        await this.extractRequestDataWithUser(req);
      const user = req.user;
      const orgId = user?.org_id || 1; // 1 is for default org
      const data = await this.aggregatesService.generateTrafficSourceNetworkCampaignsStatsReport(
        startDate,
        endDate,
        network,
        trafficSource,
        mediaBuyer,
        adAccountId,
        q,
        // orgId,
      );
      return res.json(data);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: e.message });
    }
  }

  async generateTrafficSourceNetworkDailyReport(req, res) {
    try {
      const { startDate, endDate, mediaBuyer, adAccountId } =
        await this.extractRequestDataWithUser(req);
      const data = await this.aggregatesService.generateTrafficSourceNetworkDailyReport(
        startDate,
        endDate,
        mediaBuyer,
        adAccountId,
      );
      return res.json(data);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: e.message });
    }
  }

  async generateTrafficSourceNetworkHourlyReport(req, res) {
    try {
      const { startDate, endDate, mediaBuyer, adAccountId } =
        await this.extractRequestDataWithUser(req);
      const data = await this.aggregatesService.generateTrafficSourceNetworkHourlyReport(
        startDate,
        endDate,
        mediaBuyer,
        adAccountId
      );
      return res.json(data);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: e.message });
    }
  }

  async networkCampaigns(req, res) {
    try {
      const { startDate, endDate, mediaBuyer, network } = await this.extractRequestDataWithUser(req);
      const data = await this.aggregatesService.getNetworkCampaigns(network, mediaBuyer, startDate, endDate);
      return res.json(data);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: e.message });
    }
  }

  async adAccountsSpend(req, res) {
    try {
      const { startDate, endDate, mediaBuyer, trafficSource } = await this.extractRequestDataWithUser(req);
      const data = await this.aggregatesService.getAdAccountsSpend(trafficSource, mediaBuyer, startDate, endDate);
      return res.json(data);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: e.message });
    }
  }
}

module.exports = AggregatesController;
