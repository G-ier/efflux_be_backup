// Local application imports
const CampaignsController         = require("../controllers/CampaignsController");
const InsightsController          = require("../controllers/InsightsController");

// Third Party Imports
const route                       = require("express").Router();

// Controllers
const campaignsController         = new CampaignsController();
const insightsController          = new InsightsController();


// @route     /api/tonic/sync-campaigns
// @desc      GET sync campaigns
// @Access    Private
route.get("/sync-campaigns", async (req, res) => {
  await campaignsController.syncCampaigns(req, res);
});

// @route     /api/tonic/campaigns
// @desc      GET campaigns
// @Access    Private
route.get("/campaigns", async (req, res) => {
  await campaignsController.fetchCampaigns(req, res);
});

// @route     /api/tonic/sync-insights
// @desc      GET sync insights
// @Access    Private
route.get("/sync-insights", async (req, res) => {
  await insightsController.syncInsights(req, res);
});

// @route    /api/tonic/insights
// @desc     GET insights
// @Access   Private
route.get("/insights", async (req, res) => {
  await insightsController.fetchInsights(req, res);
});

module.exports = route;
