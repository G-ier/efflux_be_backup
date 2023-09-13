const route = require("express").Router();

const management = require("./management");
const CompositeController = require("../controllers/CompositeController");
const compositeController = new CompositeController();

// @route    /api/facebook/refresh
// @desc     POST facebook refresh data
// @Access   Private
route.post("/refresh", async (req, res) => {
  compositeController.updateFacebookData(req, res);
});

route.use("/management", management);

module.exports = route;
