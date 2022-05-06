const knex = require("knex");
const knexConfig = require("../knexfile");
const environment = "development";
const db = knex(knexConfig[environment]);

module.exports = db;
