// Third Party Imports
const route = require("express").Router();

// Local application imports
const PixelController         = require("../../controllers/PixelController");

// Controllers
const pixelController         = new PixelController();

// @route     /api/tonic/pixels/
// @desc      GET pixels for campaign
// @Access    Private
route.get("/", async (req, res) => {
  await pixelController.getPixels(req, res);
});


// @route     /api/tonic/pixels/create
// @desc      GET create pixel
// @Access    Private
route.post("/create", async (req, res) => {
  await pixelController.createTrafficSourcePixel(req, res);
});

// @route     /api/tonic/pixels/invoke
// @desc      GET invoke pixel for campaign
// @Access    Private
route.post("/invoke", async (req, res) => {
  await pixelController.invokePixel(req, res);
});


module.exports = route;
