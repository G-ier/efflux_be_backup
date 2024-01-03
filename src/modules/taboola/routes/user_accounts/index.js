const route = require("express").Router();
const UserAccountController = require("../../controllers/UserAccountController");
const userAccountController = new UserAccountController();


// @route    POST /api/taboola/user_accounts
// @desc     Add Taboola user account
// @Access   Private
route.post('/add_account', async (req, res) => await userAccountController.refreshNetworkAccount(req, res));


module.exports = route;
