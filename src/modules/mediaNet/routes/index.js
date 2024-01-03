// Local application imports
const InsightController = require("../controllers/InsightController");
// const AuthService          = require("../controllers/AdController");

// Third Party Imports
const route                       = require("express").Router();

const insightController = new InsightController();


// @route     /api/medianet/sync_ads
// @desc      GET Sync Ads
// @Access    Private
route.get("/sync_ads", async (req, res) => {
    await insightController.syncInsights(req, res);
});


// @route     /api/medianet/test
// @desc      GET Test
// @Access    Private
route.get("/test", async (req, res) => {
    await insightController.insertInsights(req, res);
});


module.exports = route;