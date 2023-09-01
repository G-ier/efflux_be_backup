const route = require("express").Router();
const authController = require("../../controllers/authController");
const UserAccountController = require("../../src/modules/facebook/controllers/UserAccountController");
const Auth0Controller = require("../../src/modules/auth/controllers/Auth0Controller"); // Assuming you have this controller as discussed earlier.

const userAccountController = new UserAccountController();
const auth0Controller = new Auth0Controller();
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

// @route     /api/auth/login
// @desc      POST The function authenticates a user and returns a JWT token to the Front End
// @Access    Public
route.post("/login", async (req, res) => await auth0Controller.login(req, res));



route.post("/add_google_account", async (req, res) => {
  try {
    const { account, created } = await authController.addGoogleAccount(req.user, req.body.code);
    if (!created) {
      res.status(200).json({
        message: `Account already exists for ${account.name}`,
      });
    } else {
      res.status(200).json({
        message: `Successfully added account for ${account.name}`,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message, error });
  }
});

route.post("/add_outbrain_account", async (req, res) => {
  try {
    const { account, created } = await authController.addOutbrainAccount(req.user, req.body.userObj);
    if (!account && !created) {
      res.status(200).json({
        message: `Invalid login or password`,
      });
    } else if (!created) {
      res.status(200).json({
        message: `Account already exists for ${account.name}`,
      });
    } else {
      res.status(200).json({
        message: `Successfully added account for ${account.name}`,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message, error });
  }
});

// @route    /api/auth/reauthorize_google
// @desc     POST signing up user
// @Access   Public
route.post("/reauthorize_google", async (req, res) => {
  try {
    const { name } = await authController.reauthorizeGoogle(req.user, req.body.accountId, req.body.code);
    res.status(200).json({
      message: `Successfully reauthorized for ${name}`,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message, error });
  }
});

module.exports = route;
