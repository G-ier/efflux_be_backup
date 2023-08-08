const route = require("express").Router();

const { updateEntityController } = require("../../../controllers/facebookController");
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
module.exports = route;
