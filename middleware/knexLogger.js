const knexLogger = require('knex-logger');
const db = require('../data/dbConfig');

module.exports = process.env.NODE_ENV === 'development' ? knexLogger(db) : () => {}
