const route = require("express").Router();

const InsightsController = require("./controller/InsightsController");
const insightsController = new InsightsController();

// @route    /api/sedo/refresh
// @desc     GET sedo refresh data
// @Access   Private
route.get("/refresh", async (req, res) => {
  insightsController.syncInsights(req, res);
});

module.exports = route;
