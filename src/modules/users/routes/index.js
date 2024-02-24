const route = require("express").Router();

// Controllers
const UserController = require("../controllers/UserController");
const userController = new UserController();

// @route   /api/users/
// @desc    GET users for the dashboard
route.get("/", async (req, res) => { await userController.listUsers(req, res) });


module.exports = route;
