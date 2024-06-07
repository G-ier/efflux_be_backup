// Local application imports
const InsightsController          = require("../controllers/InsightsController");
const CompositeController         = require("../controllers/CompositeController");

// Third Party Imports
const route                       = require("express").Router();

// Controllers
const insightsController          = new InsightsController();
const compositeController         = new CompositeController();

// Sub Routes
const campaigns                   = require("./campaigns");
const pixels                      = require("./pixels");


// @route     /api/tonic/sync-insights
// @desc      GET sync insights
// @Access    Private
route.get("/sync-insights", async (req, res) => {
  await compositeController.syncData(req, res);
});

// @route    /api/tonic/insights
// @desc     GET insights
// @Access   Private
route.get("/insights", async (req, res) => {
  await insightsController.fetchInsights(req, res);
});

// @route    /api/tonic/insights_clickhouse
// @desc     GET insights_clickhouse
// @Access   Private
route.get("/insights_clickhouse", async (req, res) => {
  await insightsController.fetchInsightsClickhouse(req, res);
});

route.use("/campaigns", campaigns);
route.use("/pixels", pixels);

module.exports = route;
