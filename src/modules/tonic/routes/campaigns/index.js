// Third Party Imports
const route = require("express").Router();

// Local application imports
const CampaignsController         = require("../../controllers/CampaignsController");

// Controllers
const campaignsController         = new CampaignsController();

// @route     /api/tonic/campaigns/sync-campaigns
// @desc      GET sync campaigns
// @Access    Private
route.get("/sync-campaigns", async (req, res) => {
  await campaignsController.syncCampaigns(req, res);
});

// @route     /api/tonic/campaigns/callback
// @desc      GET sync campaigns
// @Access    Private
route.get("/callback", async (req, res) => {
  await campaignsController.getCampaignCallback(req, res);
});

// @route     /api/tonic/campaigns
// @desc      GET campaigns
// @Access    Private
route.get("/", async (req, res) => {
  await campaignsController.fetchCampaigns(req, res);
});

module.exports = route;
