const route = require("express").Router();
const Auth0Controller = require("../../src/modules/auth/controllers/Auth0Controller"); // Assuming you have this controller as discussed earlier.

const auth0Controller = new Auth0Controller();

// Use the createUser method from the Auth0Controller for the /users route
route.post("/users", async (req, res) => await auth0Controller.createUser(req, res));

module.exports = route;
