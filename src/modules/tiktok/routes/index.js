const route                 = require("express").Router();

const pixels                = require("./pixels");
const userAccounts          = require("./user_accounts");
const CompositeController   = require("../controllers/CompositeController");
const compositeController   = new CompositeController();
const UserAccountController = require("../controllers/UserAccountController");
const userAccountController = new userAccountController();

// @route    /api/tiktok/refresh
// @desc     GET tiktok refresh data
// @Access   Private
route.get("/refresh", async (req, res) => {
  compositeController.updateData(req, res);
});

// @route    /api/tiktok/sync-account-data
// @desc     GET TIKTOK Sync Account Data
// @Access   Private
route.get("/sync-account-data", async (req, res) => {
  compositeController.syncAccountData(req, res);
});

route.use("/pixels", pixels);
route.use("/user_accounts", userAccounts);

route.get('/launcher', async (req, res) => {
  userAccountController.launchTiktokFromMonday(req, res);
});

module.exports = route;
