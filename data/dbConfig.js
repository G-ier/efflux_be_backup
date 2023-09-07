const knex = require("knex");
const knexConfig = require("../knexfile");
const databaseEnvironment = process.env.DATABASE_ENVIRONMENT || "development";
const db = knex(knexConfig[databaseEnvironment]);

module.exports = db;
