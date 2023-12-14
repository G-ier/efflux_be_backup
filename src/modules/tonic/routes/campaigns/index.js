// Third Party Imports
const route = require("express").Router();

// Local application imports
const CampaignsController         = require("../../controllers/CampaignsController");

// Controllers
const campaignsController         = new CampaignsController();

// @route     /api/tonic/sync-campaigns
// @desc      GET sync campaigns
// @Access    Private
route.get("/sync-campaigns", async (req, res) => {
  await campaignsController.syncCampaigns(req, res);
});

// @route     /api/tonic/campaigns
// @desc      GET campaigns
// @Access    Private
route.get("/", async (req, res) => {
  await campaignsController.fetchCampaigns(req, res);
});

module.exports = route;
