const route = require("express").Router();

const UserAccountController = require("../../controllers/UserAccountController");

const userAccountController = new UserAccountController();

// @route     /api/auth/add_facebook_account
// @desc      POST Integrates a facebook account into our application
// @Access    Public
route.post("/add_facebook_account", async (req, res) => await userAccountController.addFacebookUserAccount(req, res));

// @route     /api/auth/reauthorize_facebook
// @desc      POST Reauthorizes a facebook account into our application
// @Access    Public
route.post(
  "/reauthorize_facebook",
  async (req, res) => await userAccountController.reauthorizeFacebookUserAccount(req, res)
);

// @route     /api/auth/
// @desc      DELETE Deletes a facebook account from our faccebook application and database
// @Access    Public
route.delete("/", async (req, res) => await userAccountController.deleteFacebookUserAccount(req, res));

module.exports = route;
