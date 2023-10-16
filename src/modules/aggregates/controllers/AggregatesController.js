const AggregatesService = require('../services/AggregatesService');

class AggregatesController {

  constructor() {
    this.aggregatesService = new AggregatesService();
  }

  async generateCampaignAdsetsReport(req, res) {
    try{
      const { startDate, endDate, campaignId } = req.query;
      const data = await this.aggregatesService.generateCampaignAdsetsReport(startDate, endDate, campaignId);
      return res.json(data);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: e.message });
    }
  }

  async generateCampaignDailyReport(req, res) {
    try {
      const { startDate, endDate, campaignId } = req.query;
      const data = await this.aggregatesService.generateCampaignDailyReport(startDate, endDate, campaignId);
      return res.json(data);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: e.message });
    }
  }

  async generateCampaignHourlyReport(req, res) {
    try {
      const { startDate, endDate, campaignId } = req.query;
      const data = await this.aggregatesService.generateCampaignHourlyReport(startDate, endDate, campaignId);
      console.log("Data that returns from generateCampaignHourlyReport: ", data)
      return res.json(data);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: e.message });
    }
  }

  async generateTrafficSourceNetworkCampaignsAdsetsStatsReport(req, res) {
    try {
      const { trafficSource, network, startDate, endDate, mediaBuyer, adAccountId, q } = req.query;
      const data = await this.aggregatesService.generateTrafficSourceNetworkCampaignsAdsetsStatsReport(
        startDate, endDate, network, trafficSource, mediaBuyer, adAccountId, q
      );
      return res.json(data);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: e.message });
    }
  }

  async generateTrafficSourceNetworkCampaignsStatsReport(req, res) {
    try {
      const { trafficSource, network, startDate, endDate, mediaBuyer, adAccountId, q } = req.query;
      const data = await this.aggregatesService.generateTrafficSourceNetworkCampaignsStatsReport(
        startDate, endDate, network, trafficSource, mediaBuyer, adAccountId, q
      );
      return res.json(data);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: e.message });
    }
  }

  async generateTrafficSourceNetworkDailyReport(req, res) {
    try {
      const { trafficSource, network, startDate, endDate, mediaBuyer, adAccountId, q } = req.query;
      const data = await this.aggregatesService.generateTrafficSourceNetworkDailyReport(
        startDate, endDate, network, trafficSource, mediaBuyer, adAccountId, q
      );
      return res.json(data);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: e.message });
    }
  }

  async generateTrafficSourceNetworkHourlyReport(req, res) {
    try {
      const { trafficSource, network, startDate, endDate, mediaBuyer, adAccountId, q } = req.query;
      const data = await this.aggregatesService.generateTrafficSourceNetworkHourlyReport(
        startDate, endDate, network, trafficSource, mediaBuyer, adAccountId, q
      );
      return res.json(data);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: e.message });
    }
  }

  async syncData(req, res) {
    try {
      const { startDate, endDate, trafficSource, network, campaignIdsRestriction } = req.query;
      const data = await this.aggregatesService.updateAggregates(network, trafficSource, startDate, endDate, campaignIdsRestriction);
      return res.json(data);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: e.message });
    }
  }

}

module.exports = AggregatesController;
