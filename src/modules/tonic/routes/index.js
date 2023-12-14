// Local application imports
const InsightsController          = require("../controllers/InsightsController");

// Third Party Imports
const route                       = require("express").Router();

// Controllers
const insightsController          = new InsightsController();

// Sub Routes
const campaigns                   = require("./campaigns");
const pixels                      = require("./pixels");


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

route.use("/campaigns", campaigns);
route.use("/pixels", pixels);

module.exports = route;
