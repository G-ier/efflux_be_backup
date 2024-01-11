const route = require("express").Router();

const management    = require("./management");
const userAccounts  = require("./userAccounts");
const pixels        = require("./pixels");
const pages         = require("./pages");
const mediaFolder   = require("./mediaFolders");
const adAccounts    = require("./adAccounts");

const CompositeController = require("../controllers/CompositeController");
const compositeController = new CompositeController();

// @route    /api/facebook/refresh
// @desc     POST facebook refresh data
// @Access   Private
route.get("/refresh", async (req, res) => {
  compositeController.updateFacebookData(req, res);
});

// @route    /api/facebook/sync-account-data
// @desc     POST facebook refresh data
// @Access   Private
route.get("/sync-account-data", async (req, res) => {
  compositeController.syncAccountData(req, res);
});

// @route    /api/facebook/report-conversions
// @desc     POST facebook refresh data
// @Access   Private
route.post("/report-conversions", async (req, res) => {
  compositeController.reportConversions(req, res);
});

// @route    /api/facebook/report-conversions
// @desc     POST facebook refresh data
// @Access   Private
route.post("/report-conversions", async (req, res) => {
  compositeController.reportConversions(req, res);
});


route.use("/management", management);
route.use("/user_accounts", userAccounts);
route.use("/pixels", pixels);
route.use("/pages", pages);
route.use("/media_folders", mediaFolder);
route.use("/ad_accounts", adAccounts);

module.exports = route;
