const route = require("express").Router();

const { updateEntityController, duplicateEntityController } = require("../../../controllers/facebookController");

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

module.exports = route;
