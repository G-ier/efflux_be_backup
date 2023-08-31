const route = require("express").Router();

const { updateEntityController, duplicateEntityController } = require("../../../controllers/facebookController");
const AdCreativesController = require("../../../src/modules/facebook/controllers/AdCreativeController");
const adCreativesController = new AdCreativesController();

// @route     /api/facebook/management/update-entity
// @desc     GET update-entity data
// @Access   Private
route.get("/update-entity", async (req, res) => {
  const { entityId, status, dailyBudget, type } = req.query;

  try {
    const updated = await updateEntityController({ type, entityId, status, dailyBudget });
    res.status(200).json({ updated });
  } catch ({ message }) {
    res.status(404).json({ message });
  }
});

// @route     /api/facebook/management/duplicate-entity
// @desc     GET update-entity data
// @Access   Private
route.post("/duplicate-entity", async (req, res) => {
  const { deep_copy, status_option, rename_options, entity_id, type } = req.body;
  console.log({ deep_copy, status_option, rename_options, entity_id });
  try {
    const response = await duplicateEntityController({ type, deep_copy, status_option, rename_options, entity_id });
    // const updated = await updateEntityController({ type, entityId, status, dailyBudget });
    res.status(200).json(response);
  } catch ({ message }) {
    res.status(404).json({ message });
  }
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
