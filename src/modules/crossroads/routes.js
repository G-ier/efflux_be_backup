const CompositeController = require("./controllers/CompositeController");
const CampaignController = require("./controllers/CampaignController");
const InsightsController = require("./controllers/InsightsController");
const VerticalController = require("./controllers/VerticalController");

const route = require("express").Router();

const compositeController = new CompositeController();
const campaignController = new CampaignController();
const insightsController = new InsightsController();
const verticalController = new VerticalController();

// @route     /api/crossroads/update-data
// @desc     POST crossroads update-data
// @Access   Private
route.post("/update-data", async (req, res) => {
  compositeController.updateData(req, res);
});

// @route     /api/crossroads/traffic-source-naked-links
// @desc     GET crossroads traffic-source-naked-links
// @Access   Private
route.get('/traffic-source-naked-links', async (req, res) =>
  insightsController.getTrafficSourceNakedLinks(req, res)
);

// @route     /api/crossroads/campaigns
// @desc      GET fetch all campaigns
// @Access    Private
route.get("/campaigns", async (req, res) => {
  await campaignController.getAllCampaigns(req, res);
});

// @route     /api/crossroads/campaign/:id
// @desc      GET get specific campaign by ID
// @Access    Private
route.get("/campaign/:id", async (req, res) => {
  try {
    const campaign = await campaignController.getCampaignById(req, res);
    res.status(200).json(campaign);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

// @route     POST /api/crossroads/assign
// @desc      POST assign category or vertical to crossroads campaign
// @Access    Private
route.post("/assign", async (req, res) => {
    await campaignController.updateCampaignById(req, res);
});

// @route     /api/crossroads/campaign/:id
// @desc      DELETE delete a campaign by ID
// @Access    Private
route.delete("/campaign/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await campaignController.deleteCampaignById(id, req, res);
    res.status(200).json({ message: `Campaign with ID ${id} deleted successfully!` });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

// @route     /api/crossroads/insight/:id
// @desc      GET an insight by ID
// @Access    Private
route.get("/insight/:id", async (req, res) => {
  return await insightsController.getCrossroadsById(req, res);
});

// @route     /api/crossroads/insights
// @desc      GET all insights
// @Access    Private
route.get("/insights", async (req, res) => {
  return await insightsController.getAllCrossroads(req, res);
});

// @route     /api/crossroads/insight/:id
// @desc      DELETE an insight by ID
// @Access    Private
route.delete("/insight/:id", async (req, res) => {
  return await insightsController.deleteCrossroadsById(req, res);
});

// @route     /api/crossroads/verticals/sync
// @desc      POST Sync verticals from Crossroads
// @Access    Private
route.post("/verticals/sync", async (req, res) => {
  await verticalController.syncVerticalsFromCrossroads(req, res);
});

// @route     /api/crossroads/verticals
// @desc      GET all verticals
// @Access    Private
route.get("/verticals", async (req, res) => {
  await verticalController.getAllVerticals(req, res);
});

// @route     /api/crossroads/vertical/:id
// @desc      GET specific vertical by ID
// @Access    Private
route.get("/vertical/:id", async (req, res) => {
  await verticalController.getVerticalById(req, res);
});

// @route     /api/crossroads/vertical/:id
// @desc      DELETE a vertical by ID
// @Access    Private
route.delete("/vertical/:id", async (req, res) => {
  await verticalController.deleteVerticalById(req, res);
});


module.exports = route;
