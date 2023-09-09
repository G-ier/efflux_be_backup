const CampaignService = require("../services/CampaignService");

class CampaignController {
  constructor() {
    this.campaignService = new CampaignService();
  }

  async getAllCampaigns(req, res) {
    try {
      const campaigns = await this.campaignService.getAllCampaigns();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCampaignById(req, res) {
    try {
      const campaign = await this.campaignService.getCampaignById(req.params.id);
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateCampaigns(req, res) {
    try {
      const result = await this.campaignService.updateCampaigns(req.body.key);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteCampaignById(req, res) {
    try {
      await this.campaignService.deleteCampaignById(req.params.id);
      res.json({ message: "Campaign deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async postCampaign(req, res) {
    try {
      const campaign = await this.campaignService.postCampaign(req.body);
      res.json(campaign);
    } catch (error) {
      res.status(500).json(error?.response?.data ?? { error: error.message });
    }
  }

  async postDomainLookUp(req, res) {
    try {
        const { key, domain, tld } = req.body;
        const suggestion = await this.campaignService.postDomainLookUp(key, domain, tld);
        res.json(suggestion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
      }
  }


  async postVerifyDomainAvailability(req, res) {
    try {
        const { key, domain } = req.body;
        const domainAvailability = await this.campaignService.postVerifyDomainAvailability(key, domain);
        res.json(domainAvailability);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
      }
  }

  async getMetadata(req, res) {
    try {
        const result = await this.campaignService.getMetadata(req.body.key);
        res.json(result);
    } catch (error) {
        console.error("Error during getMetadata:", error);
        res.status(500).json({ error: error.message });
    }
  }
}

module.exports = CampaignController;
