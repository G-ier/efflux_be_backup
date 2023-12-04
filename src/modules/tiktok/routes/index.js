const route                 = require("express").Router();

const pixels                = require("./pixels");
const userAccounts          = require("./user_accounts");
const CompositeController   = require("../controllers/CompositeController");
const compositeController   = new CompositeController();

// @route    /api/tiktok/refresh
// @desc     GET tiktok refresh data
// @Access   Private
route.get("/refresh", async (req, res) => {
  compositeController.updateData(req, res);
});

route.use("/pixels", pixels);
route.use("/user_accounts", userAccounts);

module.exports = route;
