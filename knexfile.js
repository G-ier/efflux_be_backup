// Update with your config settings.
require("dotenv").config();
const pg = require("pg");
pg.defaults.ssl = false;
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

module.exports = {
  development: {
    client: "pg",
    connection: process.env.DATABASE_URL_STAGING,
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: "./data/migrations",
    },
    useNullAsDefault: true,
    ssl: { rejectUnauthorized: false },
  },
  production: {
    client: "pg",
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: "./data/migrations",
    },
    useNullAsDefault: true,
    ssl: { rejectUnauthorized: false },
  },
  onUpdateTrigger: table => `
    CREATE TRIGGER updated_at
    BEFORE UPDATE ON ${table}
    FOR EACH ROW
    EXECUTE PROCEDURE updated_at_column();
  `
};
