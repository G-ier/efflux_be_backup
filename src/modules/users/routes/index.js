const route = require("express").Router();
const isAdmin = require("../../../../middleware/isAdmin");

// Controllers
const UserController = require("../controllers/UserController");
const userController = new UserController();

// @route   /api/users/
// @desc    GET users for the dashboard
route.get(
  "/",
  isAdmin,
  async (req, res) => { await userController.listUsers(req, res) }
);


module.exports = route;
