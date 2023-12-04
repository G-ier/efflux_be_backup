const route = require("express").Router();
const UserAccountController = require("../../controllers/UserAccountController");
const userAccountController = new UserAccountController();

// @route    POST /api/tiktok/user_accounts
// @desc     Add Tiktok user account
// @Access   Private
route.post('/add_tiktok_account', async (req, res) => await userAccountController.addAdvertiserAccount(req, res));

// @route     /api/auth/
// @desc      DELETE Deletes a facebook account from our faccebook application and database
// @Access    Public
route.delete("/", async (req, res) => await userAccountController.deteleTitkokAdvertiserAccount(req, res));


module.exports = route;
