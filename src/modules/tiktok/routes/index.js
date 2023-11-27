const route                 = require("express").Router();

const pixels                = require("./pixels");
const CompositeController   = require("../controllers/CompositeController");
const compositeController   = new CompositeController();

// @route    /api/tiktok/refresh
// @desc     GET tiktok refresh data
// @Access   Private
route.get("/refresh", async (req, res) => {
  compositeController.updateData(req, res);
});

route.use("/pixels", pixels);

module.exports = route;
