const knexLogger = require('knex-logger');
const db = require('../data/dbConfig');

module.exports = process.env.DATABASE_ENVIRONMENT === 'development' ? knexLogger(db) : () => {}
