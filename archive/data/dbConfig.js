const knex = require("knex");
const knexConfig = require("../knexfile");
const databaseEnvironment = process.env.OLD_BACKEND_DATABASE_CONNECTION;
const db = knex(knexConfig[databaseEnvironment]);

module.exports = db;
