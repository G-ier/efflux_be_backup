const route                 = require("express").Router();

const userAccounts = require("./user_accounts")


route.use("/user_accounts", userAccounts);

module.exports = route;