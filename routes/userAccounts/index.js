const route = require('express').Router();
const UserAccountController = require("../../src/modules/facebook/controllers/UserAccountController");

const userAccountController = new UserAccountController();

route.get('/', async (req, res) => await userAccountController.fetchUserAccountsByUserId(req, res));


module.exports = route;
