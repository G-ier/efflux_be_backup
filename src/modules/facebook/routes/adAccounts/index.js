const route = require("express").Router();

const AdAccountController = require("../../controllers/AdAccountController");

const adAccountController = new AdAccountController();

// @route     /api/ad_accounts/get_account_map
// @desc      POST Integrates a facebook account into our application
// @Access    Public
route.get("/get_account_map", async (req, res) => await adAccountController.fetchAdAccountsMapFromDatabase(req, res));


module.exports = route;
