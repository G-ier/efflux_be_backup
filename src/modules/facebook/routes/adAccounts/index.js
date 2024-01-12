const route = require("express").Router();

const AdAccountController = require("../../controllers/AdAccountController");

const adAccountController = new AdAccountController();

// @route     /api/ad_accounts/get_account_map
// @desc      GET Integrates a facebook account into our application
// @Access    Public
route.get("/get_account_map", async (req, res) => await adAccountController.fetchAdAccountsMapFromDatabase(req, res));

// @route     /api/ad_accounts/assign_user_account
// @desc      Post Assign user account to ad account
// @Access    Public
route.post("/assign_user_account", async (req, res) => await adAccountController.assignUserAccountToAdAccount(req, res));


module.exports = route;
