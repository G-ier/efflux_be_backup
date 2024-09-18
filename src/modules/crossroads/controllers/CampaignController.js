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

  async updateCampaignById(req, res){
    try{
      const { id, field, value } = req.body;

      const campaign = await this.campaignService.updateCampaignById(id, field, value);

      res.json(campaign);
    }
    catch(error){
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
}

module.exports = CampaignController;
