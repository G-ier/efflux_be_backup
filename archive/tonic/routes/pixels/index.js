// Third Party Imports
const route = require("express").Router();

// Local application imports
const CompositeController         = require("../../controllers/CompositeController");

// Controllers
const compositeController         = new CompositeController();

// @route     /api/tonic/pixels/
// @desc      GET pixels for campaign
// @Access    Private
route.get("/", async (req, res) => {
  await compositeController.getCampaignPixle(req, res);
});


// @route     /api/tonic/pixels/create
// @desc      GET create pixel
// @Access    Private
route.post("/create", async (req, res) => {
  await compositeController.createTrafficSourcePixel(req, res);
});

// @route     /api/tonic/pixels/invoke
// @desc      GET invoke pixel for campaign
// @Access    Private
route.post("/invoke", async (req, res) => {
  await compositeController.invokeCampaignsPixel(req, res);
});


module.exports = route;
