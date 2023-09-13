const route                   = require("express").Router();
const Auth0Controller         = require("../controllers/Auth0Controller");

const auth0Controller = new Auth0Controller();

// @route     /api/auth/login
// @desc      POST The function authenticates a user and returns a JWT token to the Front End
// @Access    Public
route.post("/login", async (req, res) => await auth0Controller.login(req, res));

// @route     /api/auth/users
// @desc      POST The function creates a user in Auth0
// @Access    Public
route.post("/users", async (req, res) => await auth0Controller.createUser(req, res));


module.exports = route;
