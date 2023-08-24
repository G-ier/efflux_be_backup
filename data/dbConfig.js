const knex = require("knex");
const knexConfig = require("../knexfile");
const environment = "production";
const db = knex(knexConfig[environment]);

module.exports = db;
