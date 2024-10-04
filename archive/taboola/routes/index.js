const route                 = require("express").Router();

const userAccounts = require("./user_accounts")

const CompositeController = require("../controllers/CompositeController");
const compositeController = new CompositeController();

// @route    /api/taboola/refresh
// @desc     GET facebook refresh data
// @Access   Private
route.get("/refresh", async (req, res) => {
  compositeController.updateTaboolaData(req, res);
});

route.post("/capiTest", async (req, res) => {
  compositeController.CapiTest(req, res);
});

route.use("/user_accounts", userAccounts);

module.exports = route;
