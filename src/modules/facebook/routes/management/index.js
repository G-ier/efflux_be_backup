const route = require("express").Router();

const AdCreativesController = require("../../controllers/AdCreativeController");
const CompositeController = require("../../controllers/CompositeController");

const adCreativesController = new AdCreativesController();
const compositeController = new CompositeController();

// @route     /api/facebook/management/update-entity
// @desc     GET update-entity data
// @Access   Private
route.get("/update-entity", async (req, res) => {
  compositeController.updateEntity(req, res);
});

// @route     /api/facebook/management/duplicate-entity
// @desc     GET update-entity data
// @Access   Private
route.post("/duplicate-entity", async (req, res) => {
  compositeController.duplicateEntity(req, res);
});

// @route     POST /api/facebook/management/ad-creatives/sync
// @desc     Sync ad creatives
// @Access   Private
route.post("/ad-creatives/sync", adCreativesController.syncAdCreatives);

// @route     GET /api/facebook/management/ad-creatives
// @desc     Fetch ad creatives
// @Access   Private
route.get("/ad-creatives", adCreativesController.fetchAdCreatives);

// @route     POST /api/facebook/management/ad-creatives
// @desc     Add a new ad creative
// @Access   Private
route.post("/ad-creatives", adCreativesController.createAdCreative);

// @route     PUT /api/facebook/management/ad-creatives/:creativeId
// @desc     Update an ad creative
// @Access   Private
route.put("/ad-creatives/:creativeId", adCreativesController.updateAdCreative);

// @route     DELETE /api/facebook/management/ad-creatives/:creativeId
// @desc     Delete an ad creative
// @Access   Private
route.delete("/ad-creatives/:creativeId", adCreativesController.deleteAdCreative);

// @route     GET /api/facebook/management/ad-creatives/:creativeId
// @desc     Fetch a specific ad creative by ID
// @Access   Private
route.get("/ad-creatives/:creativeId", adCreativesController.fetchAdCreativeById);

module.exports = route;
