const route = require("express").Router();
const authController = require("../../controllers/authController");

// @route /api/auth/add_oauth_account
route.post("/add_facebook_account", async (req, res) => {
  try {
    const { account, created } = await authController.addFacebookAccount(req.user, req.body);
    if (created) {
      res.status(200).json({
        message: `Successfully added account for ${account.name}`
      });
    } else {
      res.status(200).json({
        message: `Account already exists for ${account.name}`
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message, error });
  }
});

route.post("/add_google_account", async (req, res) => {
  try {
    const { account, created } = await authController.addGoogleAccount(req.user, req.body.code);
    if (!created) {
      res.status(200).json({
        message: `Account already exists for ${account.name}`
      })
    } else {
      res.status(200).json({
        message: `Successfully added account for ${account.name}`
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({message: error.message, error})
  }
})

route.post("/add_outbrain_account", async (req, res) => {
  try {
    const { account, created } = await authController.addOutbrainAccount(req.user, req.body.userObj);
    if (!account && !created) {
      res.status(200).json({
        message: `Invalid login or password`
      })
    } else if (!created) {
      res.status(200).json({
        message: `Account already exists for ${account.name}`
      })
    } else {
      res.status(200).json({
        message: `Successfully added account for ${account.name}`
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({message: error.message, error})
  }
})

// @route    /api/auth/login
// @desc     POST signing up user
// @Access   Public
route.post("/login", (req, res) => {
  authController.login(req.user, req.body).then((data) => {
    res.status(200).json(data);
  }).catch((error) => {
    console.error(error.message);
    res.status(500).json({ message: error.message, error });
  });
});

// @route    /api/auth/reauthorize_facebook
// @desc     POST signing up user
// @Access   Public
route.post("/reauthorize_facebook", async (req, res) => {
  try {
    const { name } = await authController.reauthorizeFacebook(req.user, req.body.accountId, req.body.user);
    res.status(200).json({
      message: `Successfully reauthorized for ${name}`,
    });
  } catch (error) {
    console.log(error.message);
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

route.delete("/", async (req, res) => {
  try {
    const count = await authController.deleteAccount(req.body.accountId);
    if(count) {
      return res.status(200).json({
        message: `Successfully deleted`,
      });
    }
    return res.status(404).json({
      message: `Account not found`
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message, error });
  }
});

module.exports = route;
