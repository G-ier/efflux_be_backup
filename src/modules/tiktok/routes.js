const route = require("express").Router();

const CompositeController = require("./controllers/CompositeController");
const compositeController = new CompositeController();

// @route    /api/tiktok/refresh
// @desc     GET tiktok refresh data
// @Access   Private
route.get("/refresh", async (req, res) => {
  compositeController.updateData(req, res);
});

module.exports = route;
